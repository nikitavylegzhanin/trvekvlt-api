import { Resolver, Query, Mutation, Arg, ID, Int } from 'type-graphql'
import { propEq } from 'ramda'

import db, { Bot, BotStatus, OrderRule } from '../../db'
import store from '../../store'
import { selectBots, editBot, addBot } from '../../store/bots'
import { botToStore } from '../../app'
import {
  getLastPosition,
  isLastPositionOpen,
  getUnsubscribeFigi,
} from '../../strategy/utils'
import { closePosition } from '../../strategy/position'
import { subscribeToOrderBook, unsubscribeFromOrderBook } from '../../api'

@Resolver()
export class BotsResolver {
  @Query(() => [Bot])
  bots() {
    return db.manager.find(Bot, {
      relations: ['levels'],
    })
  }

  @Mutation(() => Int)
  async changeBotStatus(
    @Arg('botId', () => ID) botId: Bot['id'],
    @Arg('status', () => BotStatus) status: Bot['status']
  ): Promise<number> {
    const bot = await db.manager.findOneOrFail(Bot, {
      where: { id: botId },
      relations: ['levels'],
    })

    const storedBots = selectBots(store.getState())
    const storedBot = storedBots.find(propEq('id', bot.id))

    if (status === BotStatus.RUNNING) {
      const updatedStoredBot = await botToStore({ ...bot, status })

      if (storedBot) {
        store.dispatch(editBot(updatedStoredBot))
      } else {
        store.dispatch(addBot(updatedStoredBot))
      }

      if (
        !storedBots.filter(
          (bot) =>
            bot.figi === updatedStoredBot.figi &&
            bot.status === BotStatus.RUNNING
        ).length
      ) {
        subscribeToOrderBook(updatedStoredBot.figi)
      }
    }

    if (status === BotStatus.DISABLED && storedBot) {
      const lastPosition = getLastPosition(storedBot)
      if (lastPosition && isLastPositionOpen(lastPosition.status)) {
        await closePosition(
          storedBot.id,
          lastPosition,
          OrderRule.CLOSE_MANUALLY
        )
      }

      store.dispatch(editBot({ id: botId, status }))

      const unsubscribeFigi = getUnsubscribeFigi(storedBots, botId)
      if (unsubscribeFigi) {
        unsubscribeFromOrderBook(unsubscribeFigi)
      }
    }

    const { affected } = await db.manager.update(Bot, botId, { status })

    return affected
  }
}

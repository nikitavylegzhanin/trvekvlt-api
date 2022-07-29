import { Resolver, Query, Mutation, Arg, ID, Int } from 'type-graphql'
import { propEq } from 'ramda'

import db, { Bot, BotStatus, OrderRule } from '../../db'
import store from '../../store'
import { selectBots, editBot, addBot } from '../../store/bots'
import { toStore, run } from '../../app'
import {
  getLastPosition,
  isLastPositionOpen,
  getLastTrend,
  getCloseOperation,
  getPositionValue,
} from '../../strategy/utils'
import { closePosition } from '../../strategy/position'
import { placeOrder } from '../../api'

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

    if (bot.status === BotStatus.RUNNING) {
      const updatedStoredBot = await toStore({ ...bot, status })

      if (storedBot) {
        store.dispatch(editBot(updatedStoredBot))
      } else {
        store.dispatch(addBot(updatedStoredBot))

        await run(updatedStoredBot)
      }
    }

    if (bot.status === BotStatus.DISABLED && storedBot) {
      const lastPosition = getLastPosition(storedBot)
      if (lastPosition && isLastPositionOpen(lastPosition.status)) {
        const lastTrend = getLastTrend(storedBot)

        await closePosition(
          () =>
            placeOrder(
              storedBot.figi,
              getPositionValue(lastPosition),
              getCloseOperation(lastTrend),
              storedBot.accountId
            ),
          storedBot.id,
          lastPosition,
          OrderRule.CLOSE_MANUALLY
        )
      }

      store.dispatch(editBot({ ...storedBot, status }))
    }

    const { affected } = await db.manager.update(Bot, botId, { status })

    return affected
  }
}

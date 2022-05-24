import { Scenes } from 'telegraf'
import { getConnection } from 'typeorm'
import { last, propEq } from 'ramda'

import { parseBotId } from '../utils'
import store from '../../store'
import { selectBots, addData } from '../../store/bots'
import { isDowntrend } from '../../strategy/utils'
import { Trend, TrendDirection } from '../../db'

export const addTrendAction = async (ctx: Scenes.WizardContext) => {
  if ('data' in ctx.callbackQuery) {
    const botId = parseBotId(ctx.callbackQuery.data)

    if (botId) {
      const state = store.getState()
      const bots = selectBots(state)
      const bot = bots.find(propEq('id', botId))

      try {
        const { manager } = getConnection()

        const trend = await manager.save(Trend, {
          bot: { id: botId },
          direction: isDowntrend(last(bot.trends))
            ? TrendDirection.UP
            : TrendDirection.DOWN,
        })
        store.dispatch(addData({ botId, trend }))

        return ctx.reply(`Trend with id ${trend.id} added successfully ✨`)
      } catch (error) {
        return ctx.reply(`Error: ${error.message}`)
      }
    }
  }

  return ctx.reply('Something goes wrong 🤷🏻‍♀️')
}

import { Scenes } from 'telegraf'
import { getConnection } from 'typeorm'
import { propEq } from 'ramda'

import { parseBotId } from '../utils'
import store from '../../store'
import { selectBots, editBot } from '../../store/bots'
import { isBotDisabled } from '../../strategy/utils'
import { Bot, BotStatus } from '../../db'

export const toggleStatusAction = async (ctx: Scenes.WizardContext) => {
  if ('data' in ctx.callbackQuery) {
    const botId = parseBotId(ctx.callbackQuery.data)

    if (botId) {
      const state = store.getState()
      const bots = selectBots(state)
      const bot = bots.find(propEq('id', botId))

      try {
        const { manager } = getConnection()
        const status = isBotDisabled(bot)
          ? BotStatus.RUNNING
          : BotStatus.DISABLED

        await manager.update(Bot, { id: bot.id }, { status })
        store.dispatch(editBot({ id: bot.id, status }))

        return ctx.reply(
          `The bot ${bot.name} is ${
            status === BotStatus.RUNNING ? 'running' : 'disabled'
          }`
        )
      } catch (error) {
        return ctx.reply(`Error: ${error.message}`)
      }
    }
  }

  return ctx.reply('Something goes wrong 🤷🏻‍♀️')
}

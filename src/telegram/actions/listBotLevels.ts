import { Scenes } from 'telegraf'
import { propEq } from 'ramda'

import { parseBotId } from '../utils'
import store from '../../store'
import { selectBots } from '../../store/bots'

export const listBotLevelsAction = (ctx: Scenes.WizardContext) => {
  if ('data' in ctx.callbackQuery) {
    const botId = parseBotId(ctx.callbackQuery.data)

    if (botId) {
      const state = store.getState()
      const bots = selectBots(state)
      const bot = bots.find(propEq('id', botId))

      const text = `<pre>${bot.levels
        .map((level) => level.value)
        .sort((a, b) => b - a)
        .join(' ')}</pre>`

      return ctx.reply(text, { parse_mode: 'HTML' })
    }
  }

  return ctx.reply('Something goes wrong 🤷🏻‍♀️')
}

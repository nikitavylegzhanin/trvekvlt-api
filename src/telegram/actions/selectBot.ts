import { Scenes } from 'telegraf'
import { last, propEq } from 'ramda'

import { Action } from '../telegram'
import store from '../../store'
import { selectBots } from '../../store/bots'
import { isDowntrend, isBotDisabled } from '../../strategy/utils'
import { parseBotId } from '../utils'

export const selectBotsAction = (ctx: Scenes.WizardContext) => {
  if ('data' in ctx.callbackQuery) {
    const botId = parseBotId(ctx.callbackQuery.data)

    if (botId) {
      const state = store.getState()
      const bots = selectBots(state)
      const bot = bots.find(propEq('id', botId))
      const isDisabled = isBotDisabled(bot)

      return ctx.reply(`Edit bot ${bot.name}`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `List levels (${bot.levels.length})`,
                callback_data: `${Action.BOT_LEVELS_LIST}:${botId}`,
              },
            ],
            [
              {
                text: 'Add level',
                callback_data: `${Action.BOT_LEVELS_ADD}:${botId}`,
              },
              {
                text: 'Remove level',
                callback_data: `${Action.BOT_LEVELS_REMOVE}:${botId}`,
              },
            ],
            [
              {
                text: `Set ${
                  isDowntrend(last(bot.trends)) ? 'uptrend' : 'downtrend'
                }`,
                callback_data: `${Action.BOT_TRENDS_ADD}:${botId}`,
              },
            ],
            [
              {
                text: `${isDisabled ? 'Enable' : 'Disable'} bot`,
                callback_data: `${Action.BOT_TOGGLE_STATUS}:${botId}`,
              },
            ],
          ],
        },
      })
    }
  }

  return ctx.reply('Something goes wrong 🤷🏻‍♀️')
}

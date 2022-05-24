import { Scenes } from 'telegraf'

import { Action } from '../telegram'
import store from '../../store'
import { selectBots } from '../../store/bots'
import { isBotDisabled } from '../../strategy/utils'

export const listBotsAction = (ctx: Scenes.WizardContext) => {
  const state = store.getState()
  const bots = selectBots(state)

  return ctx.reply('Select a bot', {
    reply_markup: {
      inline_keyboard: bots.map((bot) => [
        {
          text: `${isBotDisabled(bot) ? '😴' : ''} ${bot.name}`,
          callback_data: `${Action.SELECT_BOT}:${bot.id}`,
        },
      ]),
    },
  })
}

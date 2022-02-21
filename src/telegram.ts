import { Telegraf } from 'telegraf'

import store from './store'
import { editConfig } from './store/config'

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

enum Commands {
  START = 'start',
  STOP = 'stop',
}

bot.command(Commands.START, (ctx) => {
  store.dispatch(editConfig({ isDisabled: false }))

  return ctx.reply('Strategy started')
})

bot.command(Commands.STOP, (ctx) => {
  store.dispatch(editConfig({ isDisabled: true }))

  return ctx.reply('Strategy stopped')
})

bot.launch()

type Type = 'ERROR' | 'STATE'

export const sendMessage = async (type: Type, message: string) => {
  const text = `<b>${type}</b>
<pre language="javascript">${message}</pre>`

  return bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
    parse_mode: 'HTML',
  })
}

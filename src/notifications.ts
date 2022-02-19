import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

type Type = 'ERROR' | 'STATE'

export const sendMessage = async (type: Type, message: string) => {
  const text = `<b>${type}</b>
<pre language="javascript">${message}</pre>`

  return bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
    parse_mode: 'HTML',
  })
}

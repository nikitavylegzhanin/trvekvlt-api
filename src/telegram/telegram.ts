import { Scenes, session, Telegraf } from 'telegraf'

import store from '../store'
import { editConfig } from '../store/config'
import newLevelScene from './newLevelScene'

const bot = new Telegraf<Scenes.WizardContext>(process.env.TELEGRAM_TOKEN)

bot.use(session())

const stage = new Scenes.Stage<Scenes.WizardContext>([newLevelScene])
bot.use(stage.middleware())

enum Command {
  START = 'start',
  STOP = 'stop',
  LEVEL = 'level',
}

bot.command(Command.START, (ctx) => {
  store.dispatch(editConfig({ isDisabled: false }))

  return ctx.reply('Strategy started')
})

bot.command(Command.STOP, (ctx) => {
  store.dispatch(editConfig({ isDisabled: true }))

  return ctx.reply('Strategy stopped')
})

bot.command(Command.LEVEL, (ctx) => ctx.scene.enter(newLevelScene.id))

bot.launch()

type Type = 'ERROR' | 'STATE'

export const sendMessage = async (type: Type, message: string) => {
  const text = `<b>${type}</b>
<pre language="javascript">${message}</pre>`

  return bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
    parse_mode: 'HTML',
  })
}

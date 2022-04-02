import { Scenes, session, Telegraf } from 'telegraf'

import store from '../store'
import { editConfig } from '../store/config'
import { selectLevels } from '../store/levels'
import { addLevelScene, removeLevelScene } from './scenes'

const bot = new Telegraf<Scenes.WizardContext>(process.env.TELEGRAM_TOKEN)

bot.use(session())

const stage = new Scenes.Stage<Scenes.WizardContext>([
  addLevelScene,
  removeLevelScene,
])
bot.use(stage.middleware())

enum Command {
  START = 'start',
  STOP = 'stop',
  LEVEL = 'level',
}

enum Action {
  LEVEL_LIST = 'LEVEL_LIST',
  LEVEL_ADD = 'LEVEL_ADD',
  LEVEL_REMOVE = 'LEVEL_REMOVE',
}

bot.command(Command.START, (ctx) => {
  store.dispatch(editConfig({ isDisabled: false }))

  return ctx.reply('Strategy started')
})

bot.command(Command.STOP, (ctx) => {
  store.dispatch(editConfig({ isDisabled: true }))

  return ctx.reply('Strategy stopped')
})

bot.command(Command.LEVEL, (ctx) => {
  return ctx.reply('Test', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'List', callback_data: Action.LEVEL_LIST },
          { text: 'Add', callback_data: Action.LEVEL_ADD },
          { text: 'Remove', callback_data: Action.LEVEL_REMOVE },
        ],
      ],
    },
  })
})

bot.action(Action.LEVEL_LIST, (ctx) => {
  const state = store.getState()
  const levels = selectLevels(state)

  const text = `<pre>${levels
    .map((level) => level.value)
    .sort((a, b) => b - a)
    .join(' ')}</pre>`

  return ctx.reply(text, { parse_mode: 'HTML' })
})

bot.action(Action.LEVEL_ADD, (ctx) => ctx.scene.enter(addLevelScene.id))

bot.action(Action.LEVEL_REMOVE, (ctx) => ctx.scene.enter(removeLevelScene.id))

bot.launch()

type Type = 'ERROR' | 'STATE'

export const sendMessage = async (type: Type, message: string) => {
  const text = `<b>${type}</b>
<pre language="javascript">${message}</pre>`

  return bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
    parse_mode: 'HTML',
  })
}

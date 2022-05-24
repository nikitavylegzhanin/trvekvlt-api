import { Scenes, session, Telegraf } from 'telegraf'

import {
  listBotsAction,
  selectBotsAction,
  listBotLevelsAction,
  addLevelScene,
  addLevelAction,
  removeLevelScene,
  removeLevelAction,
  addTrendAction,
  toggleStatusAction,
} from './actions'

const bot = new Telegraf<Scenes.WizardContext>(process.env.TELEGRAM_TOKEN)

bot.use(session())
const stage = new Scenes.Stage<Scenes.WizardContext>([
  addLevelScene,
  removeLevelScene,
])
bot.use(stage.middleware())

enum Command {
  BOTS = 'bots',
}

export enum Action {
  SELECT_BOT = 'SELECT_BOT',
  BOT_LEVELS_LIST = 'BOT_LEVELS_LIST',
  BOT_LEVELS_ADD = 'BOT_LEVELS_ADD',
  BOT_LEVELS_REMOVE = 'BOT_LEVELS_REMOVE',
  BOT_TRENDS_ADD = 'BOT_TRENDS_ADD',
  BOT_TOGGLE_STATUS = 'BOT_TOGGLE_STATUS',
}

bot.command(Command.BOTS, listBotsAction)

bot.action(new RegExp(Action.SELECT_BOT), selectBotsAction)
bot.action(new RegExp(Action.BOT_LEVELS_LIST), listBotLevelsAction)
bot.action(new RegExp(Action.BOT_LEVELS_ADD), addLevelAction)
bot.action(new RegExp(Action.BOT_LEVELS_REMOVE), removeLevelAction)
bot.action(new RegExp(Action.BOT_TRENDS_ADD), addTrendAction)
bot.action(new RegExp(Action.BOT_TOGGLE_STATUS), toggleStatusAction)

bot.launch()

// Notifications
type Type = 'ERROR' | 'STATE'

export const sendMessage = async (type: Type, message: string) => {
  const text = `<b>${type}</b>
<pre language="javascript">${message}</pre>`

  return bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
    parse_mode: 'HTML',
  })
}

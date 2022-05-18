import { Scenes, session, Telegraf } from 'telegraf'

import store from '../store'
import { TrendDirection } from '../db/Trend'
// import { addLevelScene, removeLevelScene } from './scenes'
import addTrendAction from './addTrendAction'

const bot = new Telegraf<Scenes.WizardContext>(process.env.TELEGRAM_TOKEN)

bot.use(session())

const stage = new Scenes.Stage<Scenes.WizardContext>([
  // addLevelScene,
  // removeLevelScene,
])
bot.use(stage.middleware())

enum Command {
  START = 'start',
  STOP = 'stop',
  LEVEL = 'level',
  TREND = 'trend',
}

enum Action {
  LEVEL_LIST = 'LEVEL_LIST',
  LEVEL_ADD = 'LEVEL_ADD',
  LEVEL_REMOVE = 'LEVEL_REMOVE',
  TREND_ADD_UP = 'TREND_UP',
  TREND_ADD_DOWN = 'TREND_DOWN',
}

// // Strategy
// bot.command(Command.START, (ctx) => {
//   store.dispatch(editConfig({ isDisabled: false }))
//
//   return ctx.reply('Strategy started')
// })
//
// bot.command(Command.STOP, (ctx) => {
//   store.dispatch(editConfig({ isDisabled: true }))
//
//   return ctx.reply('Strategy stopped')
// })
//
// // Trend
// bot.command(Command.TREND, (ctx) => {
//   const lastTrend = selectLastTrend(store.getState())
//   const isUptrend = lastTrend?.direction === TrendDirection.UP
//
//   return ctx.reply(`The current trend: ${JSON.stringify(lastTrend)}`, {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: `Change to ${isUptrend ? 'downtrend' : 'uptrend'}`,
//             callback_data: isUptrend
//               ? Action.TREND_ADD_DOWN
//               : Action.TREND_ADD_UP,
//           },
//         ],
//       ],
//     },
//   })
// })
//
// bot.action(Action.TREND_ADD_UP, async (ctx) => {
//   try {
//     await addTrendAction(TrendDirection.UP)
//
//     return ctx.reply('The current trend is up')
//   } catch (error) {
//     await ctx.reply(error.message)
//     return ctx.scene.leave()
//   }
// })
//
// bot.action(Action.TREND_ADD_DOWN, async (ctx) => {
//   try {
//     await addTrendAction(TrendDirection.DOWN)
//
//     return ctx.reply('The current trend is down')
//   } catch (error) {
//     await ctx.reply(error.message)
//     return ctx.scene.leave()
//   }
// })
//
// // Level
// bot.command(Command.LEVEL, (ctx) => {
//   return ctx.reply('What to do with levels?', {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           { text: 'List', callback_data: Action.LEVEL_LIST },
//           { text: 'Add', callback_data: Action.LEVEL_ADD },
//           { text: 'Remove', callback_data: Action.LEVEL_REMOVE },
//         ],
//       ],
//     },
//   })
// })
//
// bot.action(Action.LEVEL_LIST, (ctx) => {
//   const state = store.getState()
//   const levels = selectLevels(state)
//
//   const text = `<pre>${levels
//     .map((level) => level.value)
//     .sort((a, b) => b - a)
//     .join(' ')}</pre>`
//
//   return ctx.reply(text, { parse_mode: 'HTML' })
// })
//
// bot.action(Action.LEVEL_ADD, (ctx) => ctx.scene.enter(addLevelScene.id))
//
// bot.action(Action.LEVEL_REMOVE, (ctx) => ctx.scene.enter(removeLevelScene.id))
//
// bot.launch()

// Notifications
type Type = 'ERROR' | 'STATE'

export const sendMessage = async (type: Type, message: string) => {
  const text = `<b>${type}</b>
<pre language="javascript">${message}</pre>`

  return bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
    parse_mode: 'HTML',
  })
}

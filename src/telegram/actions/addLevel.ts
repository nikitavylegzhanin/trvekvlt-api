import { Scenes } from 'telegraf'
import { getConnection } from 'typeorm'
import { propEq } from 'ramda'

import { parseBotId, getBotId } from '../utils'
import store from '../../store'
import { selectBots, addData } from '../../store/bots'
import { Level } from '../../db'

const TICK = 0.01

const getClosestLevels = (value: number) => (a: Level, b: Level) =>
  Math.abs(b.value - value) < Math.abs(a.value - value) ? b : a

const getValidationErrors = (value: number, levels: Level[]) => {
  const errors: string[] = []

  // is number
  if (Number.isNaN(value)) {
    errors.push('is not a number')
  }

  // is uniq
  if (levels.some((level) => level.value === value)) {
    errors.push('the same level exists')
  }

  // the distance to closest levels more than 9 ticks
  const closestLevel = levels.reduce(getClosestLevels(value))

  if (Math.abs(closestLevel.value - value) < TICK * 10) {
    errors.push('is less than 9 ticks')
  }

  return errors
}

interface SessionData extends Scenes.WizardSessionData {
  message: string
}

export const addLevelScene = new Scenes.WizardScene<
  Scenes.WizardContext<SessionData>
>(
  'addLevelScene',
  async (ctx) => {
    await ctx.reply('Enter a value for the new level')

    return ctx.wizard.next()
  },
  async (ctx) => {
    if ('text' in ctx.message) {
      const botId = getBotId(ctx.scene.state)

      if (botId) {
        const state = store.getState()
        const bots = selectBots(state)
        const bot = bots.find(propEq('id', botId))

        const value = Number.parseFloat(
          Number.parseFloat(ctx.message.text).toFixed(2)
        )
        const errors = getValidationErrors(value, bot.levels)

        if (!errors.length) {
          const { manager } = getConnection()
          const level = await manager.save(
            manager.create(Level, { value, bot: { id: botId } })
          )

          store.dispatch(addData({ botId, level }))

          await ctx.reply(`Level with id ${level.id} added successfully ✨`)
          return ctx.scene.leave()
        }

        await ctx.reply(`Errors: ${errors.join(', ')}`)
        return ctx.scene.leave()
      }
    }

    await ctx.reply('Something goes wrong 🤷🏻‍♀️')
    return ctx.scene.leave()
  }
)

export const addLevelAction = (ctx: Scenes.WizardContext) => {
  if ('data' in ctx.callbackQuery) {
    const botId = parseBotId(ctx.callbackQuery.data)

    if (botId) {
      return ctx.scene.enter(addLevelScene.id, { botId })
    }
  }

  return ctx.reply('Something goes wrong 🤷🏻‍♀️')
}

import { Scenes } from 'telegraf'
import { getConnection } from 'typeorm'
import { pick } from 'ramda'

import store from '../store'
import { StoredLevel, selectLevels, addLevels } from '../store/levels'
import { Level } from '../db'

const TICK = 0.01

const getClosestLevels = (value: number) => (a: StoredLevel, b: StoredLevel) =>
  Math.abs(b.value - value) < Math.abs(a.value - value) ? b : a

interface SessionData extends Scenes.WizardSessionData {
  message: string
}

const newLevelScene = new Scenes.WizardScene<Scenes.WizardContext<SessionData>>(
  'newLevelScene',
  async (ctx) => {
    await ctx.reply('Enter a value for the new level')

    return ctx.wizard.next()
  },
  // validation
  async (ctx) => {
    if ('text' in ctx.message) {
      const errors: string[] = []
      const value = Number.parseFloat(
        Number.parseFloat(ctx.message.text).toFixed(2)
      )

      // is number
      if (Number.isNaN(value)) {
        errors.push('is not a number')
      }

      // is uniq
      const levels = selectLevels(store.getState())
      if (levels.some((level) => level.value === value)) {
        errors.push('the same level exists')
      }

      // the distance to closest levels more than 9 ticks
      const closestLevel = levels.reduce(getClosestLevels(value))

      if (Math.abs(closestLevel.value - value) < TICK * 10) {
        errors.push('is less than 9 ticks')
      }

      if (errors.length) {
        await ctx.reply(`Errors: ${errors.join(', ')}`)
        return ctx.scene.leave()
      }

      // add level
      const { manager } = getConnection()
      const level = await manager.save(manager.create(Level, { value }))
      store.dispatch(addLevels([pick(['id', 'value'], level)]))

      await ctx.reply(`Level ${level.id} added successfully ✨`)
      return ctx.scene.leave()
    }

    await ctx.reply('Something goes wrong 🤷🏻‍♀️')
    return ctx.scene.leave()
  }
)

export default newLevelScene

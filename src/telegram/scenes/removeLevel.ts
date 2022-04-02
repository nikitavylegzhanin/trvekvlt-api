import { Scenes } from 'telegraf'
import { getConnection } from 'typeorm'

import store from '../../store'
import { removeLevel } from '../../store/levels'
import { Level } from '../../db'

interface SessionData extends Scenes.WizardSessionData {
  message: string
}

export const removeLevelScene = new Scenes.WizardScene<
  Scenes.WizardContext<SessionData>
>(
  'removeLevelScene',
  async (ctx) => {
    await ctx.reply('Enter the level value you want to remove')

    return ctx.wizard.next()
  },
  async (ctx) => {
    if ('text' in ctx.message) {
      const value = Number.parseFloat(
        Number.parseFloat(ctx.message.text).toFixed(2)
      )

      // is a number
      if (Number.isNaN(value)) {
        await ctx.reply(`Errors: "${ctx.message.text}" is not a valid value`)
        return ctx.scene.leave()
      }

      const { manager } = getConnection()

      try {
        const level = await manager.findOneOrFail(Level, {
          where: { value },
          select: ['id'],
        })

        await manager.delete(Level, level.id)
        store.dispatch(removeLevel(level.id))

        await ctx.reply(`Level with id ${level.id} removed successfully ✨`)
        return ctx.scene.leave()
      } catch (error) {
        await ctx.reply(error.message)
        return ctx.scene.leave()
      }
    }

    await ctx.reply('Something goes wrong 🤷🏻‍♀️')
    return ctx.scene.leave()
  }
)

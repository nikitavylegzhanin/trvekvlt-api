import { Scenes } from 'telegraf'
import { getConnection } from 'typeorm'

import { parseBotId, getBotId } from '../utils'
import store from '../../store'
import { removeData } from '../../store/bots'
import { Level } from '../../db'

export const removeLevelScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'removeLevelScene',
  async (ctx) => {
    await ctx.reply('Enter the level value you want to remove')

    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.message && 'text' in ctx.message) {
      const botId = getBotId(ctx.scene.state)

      if (botId) {
        const value = Number.parseFloat(
          Number.parseFloat(ctx.message.text).toFixed(2)
        )

        // is a number
        if (Number.isNaN(value)) {
          await ctx.reply(`Error: "${ctx.message.text}" is not a valid value`)

          return ctx.scene.leave()
        }

        try {
          const { manager } = getConnection()

          const level = await manager.findOneOrFail(Level, {
            where: { value },
            select: ['id'],
          })

          await manager.delete(Level, level.id)
          store.dispatch(removeData({ botId, level }))

          await ctx.reply(`Level with id ${level.id} removed successfully ✨`)
          return ctx.scene.leave()
        } catch (error) {
          console.log(error)
          await ctx.reply(`Error: ${error.message}`)

          return ctx.scene.leave()
        }
      }
    }

    await ctx.reply('Something goes wrong 🤷🏻‍♀️')
    return ctx.scene.leave()
  }
)

export const removeLevelAction = (ctx: Scenes.WizardContext) => {
  if ('data' in ctx.callbackQuery) {
    const botId = parseBotId(ctx.callbackQuery.data)

    if (botId) {
      return ctx.scene.enter(removeLevelScene.id, { botId })
    }
  }

  return ctx.reply('Something goes wrong 🤷🏻‍♀️')
}

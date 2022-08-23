import db, { Bot, BotStatus, Log } from '../db'
import store from '../store'
import { editBot } from '../store/bots'
import { sendMessage } from '../telegram'
import { getDisableBotTillTomorrowMessage } from './utils'

export const disableBotTillTomorrow = async (botId: Bot['id']) => {
  store.dispatch(
    editBot({
      id: botId,
      status: BotStatus.DISABLED_DURING_SESSION,
    })
  )

  if (process.env.NODE_ENV !== 'test') {
    try {
      const bot = await db.manager.findOneOrFail(Bot, { where: { id: botId } })
      bot.status = BotStatus.DISABLED_DURING_SESSION
      await db.manager.save(bot)

      const message = getDisableBotTillTomorrowMessage(botId)
      db.manager.save(db.manager.create(Log, { bot: { id: botId }, message }))
      sendMessage(message)
    } catch (error) {
      const message = JSON.stringify(error)

      sendMessage(message)
    }
  }
}

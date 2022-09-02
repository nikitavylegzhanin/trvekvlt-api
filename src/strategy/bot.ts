import db, { Bot, BotStatus, Log } from '../db'
import store from '../store'
import { editBot, selectBots } from '../store/bots'
import { sendMessage } from '../telegram'
import { getDisableBotTillTomorrowMessage, getUnsubscribeFigi } from './utils'
import { unsubscribeFromOrderBook } from '../api'

export const disableBotTillTomorrow = async (
  botId: Bot['id'],
  error?: Error
) => {
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

      const message = getDisableBotTillTomorrowMessage(botId, error)
      db.manager.save(db.manager.create(Log, { bot: { id: botId }, message }))
      sendMessage(message)

      const bots = selectBots(store.getState())
      const unsubscribeFigi = getUnsubscribeFigi(bots, botId)
      if (unsubscribeFigi) {
        unsubscribeFromOrderBook(unsubscribeFigi)
      }
    } catch (error) {
      const message = JSON.stringify(error)

      sendMessage(message)
    }
  }
}

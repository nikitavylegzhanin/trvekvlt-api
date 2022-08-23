import store from '../store'
import { addData } from '../store/bots'
import db, { Bot, Trend, TrendType, Log } from '../db'
import { sendMessage } from '../telegram'
import { getCorrectionTrendDirection, getCorrectionMessage } from './utils'

export const addCorrectionTrend = async (
  botId: Bot['id'],
  lastTrend: Trend
) => {
  const direction = getCorrectionTrendDirection(lastTrend)
  const type = TrendType.CORRECTION

  if (process.env.NODE_ENV === 'test') {
    store.dispatch(
      addData({
        botId,
        trend: {
          id: Math.floor(Math.random() * 666),
          direction,
          type,
          createdAt: new Date(),
          updatedAt: null,
          bot: null,
        },
      })
    )

    return
  }

  const { manager } = db
  const trend = await manager.save(manager.create(Trend, { direction, type }))

  store.dispatch(addData({ botId, trend }))

  const message = getCorrectionMessage(botId, trend)
  manager.save(manager.create(Log, { bot: { id: botId }, message }))
  sendMessage(message)
}

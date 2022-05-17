import { getConnection } from 'typeorm'

import store from '../store'
import { addData } from '../store/bots'
import { Bot, Trend, TrendType } from '../db'
import { getCorrectionTrendDirection } from './utils'

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
  }

  if (process.env.NODE_ENV !== 'test') {
    const { manager } = getConnection()
    const trend = await manager.save(manager.create(Trend, { direction, type }))

    store.dispatch(
      addData({
        botId,
        trend,
      })
    )
  }
}

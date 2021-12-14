import { getConnection } from 'typeorm'

import store from '../store'
import { Trend, TrendType } from '../db/Trend'
import { StoredTrend, addTrend } from '../store/trends'
import { getCorrectionTrendDirection } from './utils'

export const addCorrectionTrend = async (lastTrend: StoredTrend) => {
  const direction = getCorrectionTrendDirection(lastTrend)
  const type = TrendType.CORRECTION

  store.dispatch(
    addTrend({
      direction,
      type,
    })
  )

  if (process.env.NODE_ENV !== 'test') {
    const { manager } = getConnection()
    await manager.save(manager.create(Trend, { direction, type }))
  }
}

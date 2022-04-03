import { getConnection } from 'typeorm'

import store from '../store'
import { Trend, TrendDirection } from '../db/Trend'
import { initTrends } from '../store/trends'

const addTrendAction = async (direction: TrendDirection) => {
  const { manager } = getConnection()

  const trend = await manager.save(manager.create(Trend, { direction }))
  store.dispatch(initTrends([trend]))
}

export default addTrendAction

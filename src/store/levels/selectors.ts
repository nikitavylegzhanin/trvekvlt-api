import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'
import { TrendDirection, getLastTrend } from '../trends'

const getState = (state: Store) => state

export const getLevels = createSelector(getState, (state) => state.levels)

export const getNextLevel = createSelector(
  [getLevels, getLastTrend, (state) => state.price],
  (levels, trend, price) =>
    levels.find(
      (level) =>
        level.value ===
        (trend.direction === TrendDirection.UP ? price.bid : price.ask)
    )
)

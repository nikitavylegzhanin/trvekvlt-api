import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'
import { getLastPrice } from '../price'
import { getLastTrend, TrendDirection } from '../trends'

const getState = (state: Store) => state

export const getLastPosition = createSelector(
  getState,
  (state) => state.positions.slice(-1)[0]
)

export const getLastPositionWithLevels = createSelector(
  [getLastPosition, (state) => state.levels],
  (position, levels) =>
    position
      ? {
          ...position,
          openLevel: levels.find((level) => level.id === position.openLevelId),
          closedLevel: levels.find(
            (level) => level.id === position.closedLevelId
          ),
        }
      : undefined
)

export const getPositionProfit = createSelector(
  [getLastPositionWithLevels, getLastTrend, (state) => state.price],
  (position, lastTrend, price) => {
    const lastPrice = getLastPrice(price)

    return lastTrend?.direction === TrendDirection.UP
      ? lastPrice - position.openLevel.value
      : position.openLevel.value - lastPrice
  }
)

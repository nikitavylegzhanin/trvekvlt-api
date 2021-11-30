import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'
import { getLastTrend, TrendDirection } from '../trends'
import { getLastPositionWithLevels } from '../positions'

const getState = (state: Store) => state

export const getPrice = createSelector(getState, (state) => state.price)

export const getLastPrice = createSelector(
  [getPrice, getLastTrend],
  (price, trend) =>
    trend?.direction === TrendDirection.UP ? price.bid : price.ask
)

export const getPriceDistanceToPrevLevel = createSelector(
  [getLastPrice, getLastPositionWithLevels, (state) => state.levels],
  (lastPrice, lastPosition, levels) => {
    if (!lastPosition) return 0

    const positionLevel = lastPosition.closedLevel || lastPosition.openLevel

    if (lastPrice === positionLevel.value) return 0

    const getClosest = (a: typeof positionLevel, b: typeof positionLevel) =>
      Math.abs(b.value - lastPrice) < Math.abs(a.value - lastPrice) ? b : a

    const closestLevel1 = levels.reduce(getClosest)
    const closestLevel2 = levels
      .filter((level) => level.id !== closestLevel1.id)
      .reduce(getClosest)
    const closestValues = [closestLevel1.value, closestLevel2.value]

    const min = Math.min(...closestValues)
    const max = Math.max(...closestValues)

    const distance1 = max - min
    const distance2 = lastPrice - min
    const distance = distance2 / distance1

    return distance
  }
)

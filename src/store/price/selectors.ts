import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path } from 'ramda'

import { Price } from './reducer'
import { Store } from '../store'
import { selectLastTrend, TrendDirection, Trend } from '../trends'
import { selectLastPositionWithLevels } from '../positions'

const getState = path<Store['price']>(['price'])

export const selectPrice: Selector<Store, Price> = createSelector(
  identity,
  getState
)

export const getLastPrice = (lastPrice: Price, lastTrend: Trend) =>
  lastTrend?.direction === TrendDirection.UP ? lastPrice.bid : lastPrice.ask

export const selectLastPrice: Selector<Store, number> = createSelector(
  [getState, selectLastTrend],
  getLastPrice
)

export const selectPriceDistanceToPrevLevel: Selector<
  Store,
  number
> = createSelector(
  [
    selectLastPrice,
    selectLastPositionWithLevels,
    path<Store['levels']>(['levels']),
  ],
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

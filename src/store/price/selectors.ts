import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path } from 'ramda'

import { Price } from './reducer'
import { Store } from '../store'
import { getLastTrend, TrendDirection, Trend } from '../trends'
import { getLastPosition, getLastPositionWithLevels } from '../positions'

const getState = path<Store['price']>(['price'])

export const selectPrice: Selector<Store, Price> = createSelector(
  identity,
  getState
)

export const getLastPrice = (price: Price, lastTrend: Trend) =>
  lastTrend?.direction === TrendDirection.UP ? price.bid : price.ask
export const selectLastPrice: Selector<Store, number> = createSelector(
  [getState, path<Store['trends']>(['trends'])],
  (price, trends) => {
    const lastTrends = getLastTrend(trends)

    return getLastPrice(price, lastTrends)
  }
)

export const selectPriceDistanceToPrevLevel: Selector<
  Store,
  number
> = createSelector(
  [
    selectLastPrice,
    path<Store['positions']>(['positions']),
    path<Store['levels']>(['levels']),
  ],
  (lastPrice, positions, levels) => {
    const lastPosition = getLastPosition(positions)

    if (!lastPosition) return 0

    const positionWithLevels = getLastPositionWithLevels(lastPosition, levels)

    const positionLevel =
      positionWithLevels.closedLevel || positionWithLevels.openLevel

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

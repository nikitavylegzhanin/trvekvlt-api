import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path, findLast, T, find, propEq } from 'ramda'

import { StoredPosition } from './reducer'
import { Store } from '../store'
import { StoredLevel } from '../levels'
import { getLastPrice } from '../price'
import { getLastTrend } from '../trends'
import { TrendDirection } from '../../db/Trend'

const getState = path<Store['positions']>(['positions'])

export const selectPositions: Selector<
  Store,
  StoredPosition[]
> = createSelector(identity, getState)

export const getLastPosition = findLast<StoredPosition>(T)
export const selectLastPosition: Selector<
  Store,
  StoredPosition
> = createSelector(getState, getLastPosition)

type PositionWithLevels = StoredPosition & {
  openLevel: StoredLevel
  closedLevel?: StoredLevel
}

export const getLastPositionWithLevels = (
  position: StoredPosition,
  levels: StoredLevel[]
) => {
  if (!position) {
    return undefined
  }

  return {
    ...position,
    openLevel: find<StoredLevel>(propEq('id', position.openLevelId), levels),
    closedLevel: find<StoredLevel>(
      propEq('id', position.closedLevelId),
      levels
    ),
  }
}

export const selectLastPositionWithLevels: Selector<
  Store,
  PositionWithLevels
> = createSelector(
  [selectLastPosition, path<Store['levels']>(['levels'])],
  getLastPositionWithLevels
)

export const selectPositionProfit: Selector<Store, number> = createSelector(
  [
    selectLastPositionWithLevels,
    path<Store['trends']>(['trends']),
    path<Store['price']>(['price']),
  ],
  (position, trends, price) => {
    const lastTrend = getLastTrend(trends)
    const lastPrice = getLastPrice(price, lastTrend)

    return lastTrend?.direction === TrendDirection.UP
      ? lastPrice - position.openLevel.value
      : position.openLevel.value - lastPrice
  }
)

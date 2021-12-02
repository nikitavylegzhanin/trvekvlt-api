import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path, findLast, T, find, propEq } from 'ramda'

import { Position } from './reducer'
import { Store } from '../store'
import { Level } from '../levels'
import { getLastPrice } from '../price'
import { getLastTrend, TrendDirection } from '../trends'

const getState = path<Store['positions']>(['positions'])

export const selectPositions: Selector<Store, Position[]> = createSelector(
  identity,
  getState
)

export const getLastPosition = findLast<Position>(T)
export const selectLastPosition: Selector<Store, Position> = createSelector(
  getState,
  getLastPosition
)

type PositionWithLevels = Position & {
  openLevel: Level
  closedLevel?: Level
}

export const getLastPositionWithLevels = (
  position: Position,
  levels: Level[]
) => {
  if (!position) {
    return undefined
  }

  return {
    ...position,
    openLevel: find<Level>(propEq('id', position.openLevelId), levels),
    closedLevel: find<Level>(propEq('id', position.closedLevelId), levels),
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

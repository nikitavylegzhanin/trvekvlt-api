import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path, findLast, T, find, propEq } from 'ramda'

import { Position } from './reducer'
import { Store } from '../store'
import { Level } from '../levels'
import { getLastPrice } from '../price'
import { selectLastTrend, TrendDirection } from '../trends'

const getState = path<Store['positions']>(['positions'])

export const selectPositions: Selector<Store, Position[]> = createSelector(
  identity,
  getState
)

export const selectLastPosition: Selector<Store, Position> = createSelector(
  getState,
  findLast<Position>(T)
)

type PositionWithLevels = Position & {
  openLevel: Level
  closedLevel?: Level
}

export const selectLastPositionWithLevels: Selector<
  Store,
  PositionWithLevels
> = createSelector(
  [selectLastPosition, path<Store['levels']>(['levels'])],
  (position, levels) => {
    if (!position) {
      return undefined
    }

    return {
      ...position,
      openLevel: find<Level>(propEq('id', position.openLevelId), levels),
      closedLevel: find<Level>(propEq('id', position.closedLevelId), levels),
    }
  }
)

export const selectPositionProfit: Selector<Store, number> = createSelector(
  [
    selectLastPositionWithLevels,
    selectLastTrend,
    path<Store['price']>(['price']),
  ],
  (position, lastTrend, price) => {
    const lastPrice = getLastPrice(price, lastTrend)

    return lastTrend?.direction === TrendDirection.UP
      ? lastPrice - position.openLevel.value
      : position.openLevel.value - lastPrice
  }
)

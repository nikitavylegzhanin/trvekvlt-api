import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path, findLast, T, find, propEq } from 'ramda'

import { StoredPosition } from './reducer'
import { Store } from '../store'
import { StoredLevel } from '../levels'

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

export type PositionWithLevels = StoredPosition & {
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

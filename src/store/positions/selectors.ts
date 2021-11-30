import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'

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

import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'
import { selectLastPrice } from '../price'

const getState = (state: Store) => state

export const getLevels = createSelector(getState, (state) => state.levels)

export const getNextLevel = createSelector(
  [getLevels, selectLastPrice],
  (levels, lastPrice) => levels.find((level) => level.value === lastPrice)
)

import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'
import { getLastPrice } from '../price'

const getState = (state: Store) => state

export const getLevels = createSelector(getState, (state) => state.levels)

export const getNextLevel = createSelector(
  [getLevels, getLastPrice],
  (levels, lastPrice) => levels.find((level) => level.value === lastPrice)
)

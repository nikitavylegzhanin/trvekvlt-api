import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'

const getState = (state: Store) => state

export const getLastPosition = createSelector(
  getState,
  (state) => state.positions.slice(-1)[0]
)

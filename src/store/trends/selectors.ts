import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'

const getState = (state: Store) => state

export const getLastTrend = createSelector(
  getState,
  (state) => state.trends.slice(-1)[0]
)

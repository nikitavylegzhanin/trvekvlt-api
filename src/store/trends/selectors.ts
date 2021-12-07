import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path, findLast, T } from 'ramda'

import { StoredTrend } from './reducer'
import { Store } from '../store'

const getState = path<Store['trends']>(['trends'])

export const selectTrends: Selector<Store, StoredTrend[]> = createSelector(
  identity,
  getState
)

export const getLastTrend = findLast<StoredTrend>(T)
export const selectLastTrend: Selector<Store, StoredTrend> = createSelector(
  getState,
  getLastTrend
)

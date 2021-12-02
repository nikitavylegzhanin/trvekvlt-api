import { createSelector, Selector } from '@reduxjs/toolkit'
import { identity, path, findLast, T } from 'ramda'

import { Trend } from './reducer'
import { Store } from '../store'

const getState = path<Store['trends']>(['trends'])

export const selectTrends: Selector<Store, Trend[]> = createSelector(
  identity,
  getState
)

export const getLastTrend = findLast<Trend>(T)
export const selectLastTrend: Selector<Store, Trend> = createSelector(
  getState,
  getLastTrend
)

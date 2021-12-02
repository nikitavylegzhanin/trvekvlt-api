import { createSelector, Selector } from '@reduxjs/toolkit'
import { find, propEq, path, identity } from 'ramda'

import { Level } from './reducer'
import { Store } from '../store'
import { getLastPrice } from '../price'
import { selectLastTrend } from '../trends'

const getState = path<Store['levels']>(['levels'])

export const selectLevels: Selector<Store, Level[]> = createSelector(
  identity,
  getState
)

export const selectNextLevel: Selector<Store, Level> = createSelector(
  [getState, path<Store['price']>(['price']), selectLastTrend],
  (levels, price, lastTrend) =>
    find<Level>(propEq('value', getLastPrice(price, lastTrend)), levels)
)

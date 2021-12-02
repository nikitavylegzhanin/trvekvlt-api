import { createSelector, Selector } from '@reduxjs/toolkit'
import { find, propEq, path, identity } from 'ramda'

import { Level } from './reducer'
import { Store } from '../store'
import { getLastTrend } from '../trends'
import { getLastPrice } from '../price'

const getState = path<Store['levels']>(['levels'])

export const selectLevels: Selector<Store, Level[]> = createSelector(
  identity,
  getState
)

export const selectNextLevel: Selector<Store, Level> = createSelector(
  [
    getState,
    path<Store['price']>(['price']),
    path<Store['trends']>(['trends']),
  ],
  (levels, price, trends) => {
    const lastTrend = getLastTrend(trends)
    const lastPrice = getLastPrice(price, lastTrend)

    return find<Level>(propEq('value', lastPrice), levels)
  }
)

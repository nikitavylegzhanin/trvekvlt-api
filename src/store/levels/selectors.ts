import { createSelector, Selector } from '@reduxjs/toolkit'
import { find, propEq, path, identity } from 'ramda'

import { StoredLevel } from './reducer'
import { Store } from '../store'
import { getLastTrend } from '../trends'
import { getLastPrice } from '../price'

const getState = path<Store['levels']>(['levels'])

export const selectLevels: Selector<Store, StoredLevel[]> = createSelector(
  identity,
  getState
)

export const selectNextLevel: Selector<Store, StoredLevel> = createSelector(
  [
    getState,
    path<Store['price']>(['price']),
    path<Store['trends']>(['trends']),
  ],
  (levels, price, trends) => {
    const lastTrend = getLastTrend(trends)
    const lastPrice = getLastPrice(price, lastTrend)

    return find<StoredLevel>(propEq('value', lastPrice), levels)
  }
)

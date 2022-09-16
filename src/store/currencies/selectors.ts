import { createSelector, Selector } from '@reduxjs/toolkit'
import { path, identity } from 'ramda'

import { Store } from '../store'

const getState = path<Store['currencies']>(['currencies'])

export const selectCurrencies: Selector<Store, Store['currencies']> =
  createSelector(identity, getState)

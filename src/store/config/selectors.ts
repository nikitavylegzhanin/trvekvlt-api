import { createSelector, Selector } from '@reduxjs/toolkit'
import { path, identity } from 'ramda'

import { Store } from '../store'

const getState = path<Store['config']>(['config'])

export const selectConfig: Selector<Store, Store['config']> = createSelector(
  identity,
  getState
)

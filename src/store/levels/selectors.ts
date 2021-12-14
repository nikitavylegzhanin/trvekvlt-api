import { createSelector, Selector } from '@reduxjs/toolkit'
import { path, identity } from 'ramda'

import { StoredLevel } from './reducer'
import { Store } from '../store'

const getState = path<Store['levels']>(['levels'])

export const selectLevels: Selector<Store, StoredLevel[]> = createSelector(
  identity,
  getState
)

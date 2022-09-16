import { createSelector, Selector } from '@reduxjs/toolkit'
import { path, identity } from 'ramda'

import { Store } from '../store'

const getState = path<Store['accounts']>(['accounts'])

export const selectAccounts: Selector<Store, Store['accounts']> =
  createSelector(identity, getState)

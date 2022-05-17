import { createSelector, Selector } from '@reduxjs/toolkit'
import { path, identity } from 'ramda'

import { Store } from '../store'

const getState = path<Store['bots']>(['bots'])

export const selectBots: Selector<Store, Store['bots']> = createSelector(
  identity,
  getState
)

import { createSelector } from '@reduxjs/toolkit'

import { Store } from '../store'

const getState = (state: Store) => state

export const getPrice = createSelector(getState, (state) => state.price)

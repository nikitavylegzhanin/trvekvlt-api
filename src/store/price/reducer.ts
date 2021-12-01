import { createReducer } from '@reduxjs/toolkit'

import { changePrice } from './actions'

export type Price = {
  ask: number
  bid: number
}

const initState: Price = {
  ask: 0,
  bid: 0,
}

const reducer = createReducer(initState, (builder) =>
  builder.addCase(changePrice, (_, action) => action.payload)
)

export default reducer

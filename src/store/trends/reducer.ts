import { createReducer, nanoid } from '@reduxjs/toolkit'

import { addTrend } from './actions'

export enum TrendDirection {
  UP,
  DOWN,
}

export type Trend = {
  id: string
  direction: TrendDirection
  isCorrection?: boolean
}

const reducer = createReducer<Trend[]>([], (builder) =>
  builder.addCase(addTrend, (state, action) =>
    state.concat({
      ...action.payload,
      id: nanoid(),
    })
  )
)

export default reducer

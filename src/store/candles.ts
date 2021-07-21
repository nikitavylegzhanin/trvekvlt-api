import { createReducer, createAction } from '@reduxjs/toolkit'
import { CandleStreaming } from '@tinkoff/invest-openapi-js-sdk'

import { logChart } from '../chart'

enum ActionTypes {
  ADD = 'Candles/ADD',
}

export const addCandles = createAction<
  CandleStreaming[] | CandleStreaming,
  ActionTypes.ADD
>(ActionTypes.ADD)

const reducer = createReducer<CandleStreaming[]>([], (builder) =>
  builder.addCase(addCandles, (state, action) => {
    if (Array.isArray(action.payload)) {
      return [...state, ...action.payload]
    }

    const { time } = action.payload
    const index = state.findIndex((candle) => candle.time === time)

    if (index !== -1) {
      state[index] = action.payload
    } else {
      state.push(action.payload)
    }

    logChart(state.map(({ c }) => c))
  })
)

export default reducer

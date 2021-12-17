import { createReducer } from '@reduxjs/toolkit'

import { initTrends, addTrend, updateTrend } from './actions'
import { Trend } from '../../db/Trend'

export type StoredTrend = {
  id: Trend['id'] | number
  direction: Trend['direction']
  type: Trend['type']
}

const reducer = createReducer<StoredTrend[]>([], (builder) =>
  builder
    .addCase(initTrends, (_, action) => action.payload)
    .addCase(addTrend, (state, action) =>
      state.concat({
        ...action.payload,
        id: 0,
      })
    )
    .addCase(updateTrend, (state, action) =>
      state.map((trend) =>
        trend.id === action.payload.trendId
          ? { ...trend, ...action.payload.data }
          : trend
      )
    )
)

export default reducer

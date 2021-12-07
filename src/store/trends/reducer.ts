import { createReducer } from '@reduxjs/toolkit'

import { addTrend } from './actions'
import { Trend } from '../../db/Trend'

export type StoredTrend = {
  id: Trend['id']
  direction: Trend['direction']
  type: Trend['type']
}

const reducer = createReducer<StoredTrend[]>([], (builder) =>
  builder.addCase(addTrend, (state, action) =>
    state.concat({
      ...action.payload,
      id: 0,
    })
  )
)

export default reducer

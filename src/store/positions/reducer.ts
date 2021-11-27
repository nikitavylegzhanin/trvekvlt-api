import { createReducer } from '@reduxjs/toolkit'

import { openPosition, resetPositions } from './actions'

export type Position = {
  id: string
  levelId: string
  isClosed?: boolean
}

const reducer = createReducer<Position[]>([], (builder) =>
  builder
    .addCase(openPosition, (state, action) => state.concat(action.payload))
    .addCase(resetPositions, () => [])
)

export default reducer

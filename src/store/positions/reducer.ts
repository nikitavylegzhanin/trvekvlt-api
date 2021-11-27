import { createReducer } from '@reduxjs/toolkit'

import { resetPositions, openPosition, closePosition } from './actions'

export type Position = {
  id: string
  levelId: string
  isClosed?: boolean
}

const reducer = createReducer<Position[]>([], (builder) =>
  builder
    .addCase(resetPositions, () => [])
    .addCase(openPosition, (state, action) => state.concat(action.payload))
    .addCase(closePosition, (state, action) =>
      state.map((position) => ({
        ...position,
        isClosed: position.id === action.payload.positionId,
      }))
    )
)

export default reducer

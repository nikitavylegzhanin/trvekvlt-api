import { createReducer } from '@reduxjs/toolkit'

import { resetPositions, openPosition, closePosition } from './actions'

export type Position = {
  id: string
  openLevelId: string
  closedLevelId?: string
}

const reducer = createReducer<Position[]>([], (builder) =>
  builder
    .addCase(resetPositions, () => [])
    .addCase(openPosition, (state, action) => state.concat(action.payload))
    .addCase(closePosition, (state, action) =>
      state.map((position) => ({
        ...position,
        closedLevelId: action.payload.closedLevelId,
      }))
    )
)

export default reducer

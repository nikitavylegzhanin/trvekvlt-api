import { createReducer } from '@reduxjs/toolkit'

import {
  resetPositions,
  openPosition,
  closePosition,
  addPositionClosingRule,
} from './actions'
import { Position, DEFAULT_CLOSING_RULES } from '../../db'

export type StoredPosition = {
  id: Position['id']
  closingRules: Position['closingRules']
  openLevelId: number
  closedByRule?: Position['closedByRule']
  closedLevelId?: number
}

const reducer = createReducer<StoredPosition[]>([], (builder) =>
  builder
    .addCase(resetPositions, () => [])
    .addCase(openPosition, (state, action) =>
      state.concat({
        ...action.payload,
        id: 0,
        closingRules: DEFAULT_CLOSING_RULES,
      })
    )
    .addCase(closePosition, (state, action) =>
      state.map((position) => ({
        ...position,
        closedLevelId: action.payload.closedLevelId,
        closedByRule: action.payload.closedByRule,
      }))
    )
    .addCase(addPositionClosingRule, (state, action) =>
      state.map((position) => ({
        ...position,
        closingRules:
          position.id === action.payload.positionId
            ? position.closingRules.concat(action.payload.closingRule)
            : position.closingRules,
      }))
    )
)

export default reducer

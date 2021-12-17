import { createReducer } from '@reduxjs/toolkit'

import {
  initPositions,
  addPosition,
  updatePosition,
  removePosition,
  addPositionClosingRule,
} from './actions'
import {
  Position,
  DEFAULT_CLOSING_RULES,
  PositionStatus,
  Level,
} from '../../db'

export type StoredPosition = {
  id: Position['id'] | number
  status: Position['status']
  closingRules: Position['closingRules']
  openLevelId: Level['id']
  closedByRule?: Position['closedByRule']
  closedLevelId?: Level['id']
}

const reducer = createReducer<StoredPosition[]>([], (builder) =>
  builder
    .addCase(initPositions, (_, action) => action.payload)
    .addCase(addPosition, (state, action) =>
      state.concat({
        ...action.payload,
        id: 0,
        status: PositionStatus.OPENING,
        closingRules: DEFAULT_CLOSING_RULES,
      })
    )
    .addCase(updatePosition, (state, action) =>
      state.map((position) =>
        position.id === action.payload.positionId
          ? { ...position, ...action.payload.data }
          : position
      )
    )
    .addCase(removePosition, (state, action) =>
      state.filter((position) => position.id !== action.payload)
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

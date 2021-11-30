import { createReducer } from '@reduxjs/toolkit'

import {
  resetPositions,
  openPosition,
  closePosition,
  addPositionClosingRule,
} from './actions'

export enum ClosingRule {
  TP,
  SLT_3TICKS,
  SLT_50PERCENT,
}

export type Position = {
  id: string
  openLevelId: string
  isClosed?: boolean
  closedLevelId?: string
  closingRules: ClosingRule[]
  closedByRule?: ClosingRule
}

const reducer = createReducer<Position[]>([], (builder) =>
  builder
    .addCase(resetPositions, () => [])
    .addCase(openPosition, (state, action) =>
      state.concat({
        ...action.payload,
        id: Math.random().toString(36),
        closingRules: [ClosingRule.TP],
      })
    )
    .addCase(closePosition, (state, action) =>
      state.map((position) => ({
        ...position,
        isClosed: position.id === action.payload.positionId,
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

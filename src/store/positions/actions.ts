import { createAction } from '@reduxjs/toolkit'

import { ClosingRule } from './reducer'

export enum PositionsActionType {
  RESET_POSITIONS = 'Positions/RESET_POSITIONS',
  OPEN_POSITION = 'Positions/OPEN_POSITION',
  CLOSE_POSITION = 'Positions/CLOSE_POSITION',
  ADD_POSITION_CLOSING_RULE = 'Positions/ADD_POSITION_CLOSING_RULE',
}

export const resetPositions = createAction(PositionsActionType.RESET_POSITIONS)

type OpenPositionPayload = {
  openLevelId: string
}

export const openPosition = createAction<
  OpenPositionPayload,
  PositionsActionType.OPEN_POSITION
>(PositionsActionType.OPEN_POSITION)

type ClosePositionPayload = {
  positionId: string
  closedLevelId?: string
  closedByRule: ClosingRule
}

export const closePosition = createAction<
  ClosePositionPayload,
  PositionsActionType.CLOSE_POSITION
>(PositionsActionType.CLOSE_POSITION)

type AddPositionClosingRulePayload = {
  positionId: string
  closingRule: ClosingRule
}

export const addPositionClosingRule = createAction<
  AddPositionClosingRulePayload,
  PositionsActionType.ADD_POSITION_CLOSING_RULE
>(PositionsActionType.ADD_POSITION_CLOSING_RULE)

import { createAction } from '@reduxjs/toolkit'

import { PositionClosingRule } from '../../db'

export enum PositionsActionType {
  RESET_POSITIONS = 'Positions/RESET_POSITIONS',
  OPEN_POSITION = 'Positions/OPEN_POSITION',
  CLOSE_POSITION = 'Positions/CLOSE_POSITION',
  ADD_POSITION_CLOSING_RULE = 'Positions/ADD_POSITION_CLOSING_RULE',
}

export const resetPositions = createAction(PositionsActionType.RESET_POSITIONS)

type OpenPositionPayload = {
  openLevelId: number
}

export const openPosition = createAction<
  OpenPositionPayload,
  PositionsActionType.OPEN_POSITION
>(PositionsActionType.OPEN_POSITION)

export type ClosePositionPayload = {
  positionId: number
  closedLevelId?: number
  closedByRule: PositionClosingRule
}

export const closePosition = createAction<
  ClosePositionPayload,
  PositionsActionType.CLOSE_POSITION
>(PositionsActionType.CLOSE_POSITION)

type AddPositionClosingRulePayload = {
  positionId: number
  closingRule: PositionClosingRule
}

export const addPositionClosingRule = createAction<
  AddPositionClosingRulePayload,
  PositionsActionType.ADD_POSITION_CLOSING_RULE
>(PositionsActionType.ADD_POSITION_CLOSING_RULE)

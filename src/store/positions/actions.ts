import { createAction } from '@reduxjs/toolkit'

import { Position } from './reducer'

export enum PositionsActionTypes {
  RESET_POSITIONS = 'Positions/RESET_POSITIONS',
  OPEN_POSITION = 'Positions/OPEN_POSITION',
  CLOSE_POSITION = 'Positions/CLOSE_POSITION',
}

export const resetPositions = createAction(PositionsActionTypes.RESET_POSITIONS)

export const openPosition = createAction<
  Position,
  PositionsActionTypes.OPEN_POSITION
>(PositionsActionTypes.OPEN_POSITION)

export enum ClosePositionReason {
  TP,
}

type ClosePositionPayload = {
  positionId: string
  reason: ClosePositionReason
}

export const closePosition = createAction<
  ClosePositionPayload,
  PositionsActionTypes.CLOSE_POSITION
>(PositionsActionTypes.CLOSE_POSITION)

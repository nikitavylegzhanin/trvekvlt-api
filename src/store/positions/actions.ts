import { createAction } from '@reduxjs/toolkit'

import { Position } from './reducer'

export enum PositionsActionTypes {
  OPEN_POSITION = 'Positions/OPEN_POSITION',
  RESET_POSITIONS = 'Positions/RESET_POSITIONS',
}

export const openPosition = createAction<
  Position,
  PositionsActionTypes.OPEN_POSITION
>(PositionsActionTypes.OPEN_POSITION)

export const resetPositions = createAction(PositionsActionTypes.RESET_POSITIONS)

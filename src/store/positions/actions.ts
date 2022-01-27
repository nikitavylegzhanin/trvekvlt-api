import { createAction } from '@reduxjs/toolkit'

import { StoredPosition } from './reducer'
import { Level } from '../../db'

export enum PositionsActionType {
  INIT_POSITIONS = 'Positions/INIT_POSITIONS',
  ADD_POSITION = 'Positions/ADD_POSITION',
  UPDATE_POSITION = 'Positions/UPDATE_POSITION',
  REMOVE_POSITION = 'Positions/REMOVE_POSITION',
}

export const initPositions = createAction<
  StoredPosition[],
  PositionsActionType.INIT_POSITIONS
>(PositionsActionType.INIT_POSITIONS)

export type OpenPositionPayload = {
  openLevelId: Level['id']
}

export const addPosition = createAction<
  OpenPositionPayload,
  PositionsActionType.ADD_POSITION
>(PositionsActionType.ADD_POSITION)

type UpdatePositionPayload = {
  positionId: StoredPosition['id']
  data: Partial<StoredPosition>
}

export const updatePosition = createAction<
  UpdatePositionPayload,
  PositionsActionType.UPDATE_POSITION
>(PositionsActionType.UPDATE_POSITION)

export const removePosition = createAction<
  StoredPosition['id'],
  PositionsActionType.REMOVE_POSITION
>(PositionsActionType.REMOVE_POSITION)

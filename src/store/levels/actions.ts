import { createAction } from '@reduxjs/toolkit'

import { Level } from './reducer'

export enum LevelsActionType {
  ADD_LEVELS = 'Levels/ADD_LEVELS',
  DISABLE_LEVEL = 'Levels/DISABLE_LEVEL',
  ENABLE_LEVEL = 'Levels/ENABLE_LEVEL',
}

export const addLevels = createAction<Level[], LevelsActionType.ADD_LEVELS>(
  LevelsActionType.ADD_LEVELS
)

export const disableLevel = createAction<
  Level['id'],
  LevelsActionType.DISABLE_LEVEL
>(LevelsActionType.DISABLE_LEVEL)
export const enableLevel = createAction<
  Level['id'],
  LevelsActionType.ENABLE_LEVEL
>(LevelsActionType.ENABLE_LEVEL)
import { createAction } from '@reduxjs/toolkit'

import { StoredLevel } from './reducer'

export enum LevelsActionType {
  INIT_LEVELS = 'Levels/RESET_LEVELS',
  ADD_LEVELS = 'Levels/ADD_LEVELS',
  DISABLE_LEVEL = 'Levels/DISABLE_LEVEL',
  ENABLE_LEVEL = 'Levels/ENABLE_LEVEL',
}

export const initLevels = createAction<
  StoredLevel[],
  LevelsActionType.INIT_LEVELS
>(LevelsActionType.INIT_LEVELS)

export const addLevels = createAction<
  StoredLevel[],
  LevelsActionType.ADD_LEVELS
>(LevelsActionType.ADD_LEVELS)

export const disableLevel = createAction<
  StoredLevel['id'],
  LevelsActionType.DISABLE_LEVEL
>(LevelsActionType.DISABLE_LEVEL)
export const enableLevel = createAction<
  StoredLevel['id'],
  LevelsActionType.ENABLE_LEVEL
>(LevelsActionType.ENABLE_LEVEL)

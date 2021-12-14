import { createAction } from '@reduxjs/toolkit'

import { StoredLevel } from './reducer'

export enum LevelsActionType {
  INIT_LEVELS = 'Levels/INIT_LEVELS',
  ADD_LEVELS = 'Levels/ADD_LEVELS',
  REMOVE_LEVEL = 'Levels/REMOVE_LEVEL',
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

export const removeLevel = createAction<
  StoredLevel['id'],
  LevelsActionType.REMOVE_LEVEL
>(LevelsActionType.REMOVE_LEVEL)

export const disableLevel = createAction<
  StoredLevel['id'],
  LevelsActionType.DISABLE_LEVEL
>(LevelsActionType.DISABLE_LEVEL)
export const enableLevel = createAction<
  StoredLevel['id'],
  LevelsActionType.ENABLE_LEVEL
>(LevelsActionType.ENABLE_LEVEL)

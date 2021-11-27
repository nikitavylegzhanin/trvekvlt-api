import { createAction } from '@reduxjs/toolkit'

import { Level } from './reducer'

export enum LevelsActionTypes {
  ADD_LEVELS = 'Levels/ADD_LEVELS',
}

export const addLevels = createAction<Level[], LevelsActionTypes.ADD_LEVELS>(
  LevelsActionTypes.ADD_LEVELS
)

import { createReducer } from '@reduxjs/toolkit'

import { initLevels, addLevels, disableLevel, enableLevel } from './actions'
import { Level } from '../../db'

export type StoredLevel = {
  id: Level['id']
  value: Level['value']
  isDisabled?: boolean
}

const reducer = createReducer<StoredLevel[]>([], (builder) =>
  builder
    .addCase(initLevels, (_, action) => action.payload)
    .addCase(addLevels, (state, action) => state.concat(action.payload))
    .addCase(disableLevel, (state, action) =>
      state.map((level) => ({
        ...level,
        isDisabled: level.id === action.payload ? true : level.isDisabled,
      }))
    )
    .addCase(enableLevel, (state, action) =>
      state.map((level) => ({
        ...level,
        isDisabled: level.id === action.payload ? false : level.isDisabled,
      }))
    )
)

export default reducer

import { createReducer } from '@reduxjs/toolkit'

import { addLevels, disableLevel, enableLevel } from './actions'

export type Level = {
  id: string
  value: number
  isDisabled: boolean
}

const reducer = createReducer<Level[]>([], (builder) =>
  builder
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

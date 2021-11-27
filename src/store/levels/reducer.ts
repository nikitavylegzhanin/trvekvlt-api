import { createReducer } from '@reduxjs/toolkit'

import { addLevels } from './actions'

export type Level = {
  id: string
  value: number
}

const reducer = createReducer<Level[]>([], (builder) =>
  builder.addCase(addLevels, (state, action) => state.concat(action.payload))
)

export default reducer

import { createReducer } from '@reduxjs/toolkit'

import { editConfig } from './actions'

export type EditableConfigParams = Partial<{
  ticker: string
  figi: string
  isDisabled: boolean
}>

type Config = {
  isSandbox: boolean
} & EditableConfigParams

const initialState: Config = {
  isSandbox: process.env.IS_SANDBOX === 'true',
  ticker: process.env.TICKER,
  isDisabled: false,
}

const reducer = createReducer(initialState, (builder) =>
  builder.addCase(editConfig, (state, action) => ({
    ...state,
    ...action.payload,
  }))
)

export default reducer

import { createReducer } from '@reduxjs/toolkit'

import { editConfig } from './actions'

const isSandbox = process.env.IS_SANDBOX === 'true'

const api = {
  apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
  secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
  socketURL: process.env.API_URL_WS,
}

export type EditableConfigParams = Partial<{
  ticker: string
  figi: string
  isDisabled: boolean
}>

type Config = {
  api: typeof api
  isSandbox: boolean
} & EditableConfigParams

const initialState: Config = {
  api: {
    apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
    secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
    socketURL: process.env.API_URL_WS,
  },
  isSandbox,
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

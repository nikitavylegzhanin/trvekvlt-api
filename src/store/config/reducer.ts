import { createReducer } from '@reduxjs/toolkit'

import { editConfig } from './actions'

const isSandbox = process.env.IS_SANDBOX === 'true'

const api = {
  apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
  secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
  socketURL: process.env.API_URL_WS,
}

export type EditableConfigParams = {
  ticker?: string
  figi?: string
}

type Config = {
  api: typeof api
} & EditableConfigParams

const initialState: Config = {
  api: {
    apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
    secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
    socketURL: process.env.API_URL_WS,
  },
  ticker: process.env.TICKER,
}

const reducer = createReducer(initialState, (builder) =>
  builder.addCase(editConfig, (state, action) => ({
    ...state,
    ...action.payload,
  }))
)

export default reducer

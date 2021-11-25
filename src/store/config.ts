import { Interval } from '@tinkoff/invest-openapi-js-sdk'
import {
  createReducer,
  createAction,
  ActionCreatorWithPayload,
} from '@reduxjs/toolkit'

const isSandbox = process.env.IS_SANDBOX === 'true'

const api = {
  apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
  secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
  socketURL: process.env.API_URL_WS,
}

type EditableParams = {
  ticker?: string
  figi?: string
}

type State = {
  api: typeof api
  interval: Interval
} & EditableParams

const initialState: State = {
  api: {
    apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
    secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
    socketURL: process.env.API_URL_WS,
  },
  interval: '1min',
  ticker: 'GAZP',
}

enum ActionTypes {
  EDIT = 'Config/EDIT',
}

type EditConfigPayload = Partial<EditableParams>
export const editConfig: ActionCreatorWithPayload<EditConfigPayload> = createAction<
  EditConfigPayload,
  ActionTypes.EDIT
>(ActionTypes.EDIT)

const reducer = createReducer(initialState, (builder) =>
  builder.addCase(editConfig, (state, action) => ({
    ...state,
    ...action.payload,
  }))
)

export default reducer

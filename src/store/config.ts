import {
  createReducer,
  createAction,
  ActionCreatorWithPayload,
} from '@reduxjs/toolkit'

const isSandbox = process.env.IS_SANDBOX === 'true'
const params = { interval: '5min', ticker: '', figi: '' }
const initialState = {
  api: {
    apiURL: process.env[isSandbox ? 'API_URL_SANDBOX' : 'API_URL'],
    secretToken: process.env[isSandbox ? 'API_TOKEN_SANDBOX' : 'API_TOKEN'],
    socketURL: process.env.API_URL_WS,
  },
  ...params,
}

enum ActionTypes {
  EDIT = 'Config/EDIT',
}

type EditConfigPayload = Partial<typeof params>
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

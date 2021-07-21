import { createReducer, createAction } from '@reduxjs/toolkit'

const initialState = {
  api: {
    apiURL: process.env.API_URL,
    socketURL: process.env.API_URL_WS,
    secretToken: process.env.TOKEN_SANDBOX,
  },
  ticker: 'EQT',
  figi: '',
}

enum ActionTypes {
  EDIT = 'Config/EDIT',
}

type EditableParams = 'ticker' | 'figi'
type EditParamPayload = { name: EditableParams; value: string }

export const editConfig = createAction<EditParamPayload, ActionTypes.EDIT>(
  ActionTypes.EDIT
)

const reducer = createReducer(initialState, (builder) =>
  builder.addCase(editConfig, (state, action) => {
    state[action.payload.name] = action.payload.value
  })
)

export default reducer

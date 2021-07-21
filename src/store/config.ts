import {
  createReducer,
  createAction,
  ActionCreatorWithPayload,
} from '@reduxjs/toolkit'

const params = { interval: '5min', ticker: '', figi: '' }
const initialState = {
  api: {
    apiURL: process.env.API_URL,
    socketURL: process.env.API_URL_WS,
    secretToken: process.env.TOKEN_SANDBOX,
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

import { createAction } from '@reduxjs/toolkit'
import type { Operation } from '@tinkoff/invest-openapi-js-sdk'

enum ActionTypes {
  ADD_OPERATIONS = 'Positions/ADD_OPERATIONS',
}

export const addOperations = createAction<
  Operation[],
  ActionTypes.ADD_OPERATIONS
>(ActionTypes.ADD_OPERATIONS)

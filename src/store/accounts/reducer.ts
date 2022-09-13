import { Account } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Account'
import { createReducer } from '@reduxjs/toolkit'

import { initAccounts } from './actions'

export type StoredAccount = {
  id: Account['id']
  name: Account['name']
  isFullAccess: boolean
  isSandbox: boolean
  liquidPortfolio?: number
}

const reducer = createReducer<StoredAccount[]>([], (builder) =>
  builder.addCase(initAccounts, (_bots, action) => action.payload)
)

export default reducer

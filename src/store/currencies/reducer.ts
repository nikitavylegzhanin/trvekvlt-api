import { Currency } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Currency'
import { createReducer } from '@reduxjs/toolkit'

import { initCurrencies } from './actions'

export type StoredCurrency = {
  figi: Currency['figi']
  name: Currency['name']
  isoName: Currency['isoCurrencyName']
  lastPrice: number
  date: Date
}

const reducer = createReducer<StoredCurrency[]>([], (builder) =>
  builder.addCase(initCurrencies, (_currencies, action) => action.payload)
)

export default reducer

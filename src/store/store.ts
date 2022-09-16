import { configureStore } from '@reduxjs/toolkit'

import accounts from './accounts'
import currencies from './currencies'
import bots from './bots'

const store = configureStore({
  reducer: { accounts, currencies, bots },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type Store = ReturnType<typeof store.getState>

export default store

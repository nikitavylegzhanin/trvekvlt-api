import { configureStore } from '@reduxjs/toolkit'

import accounts from './accounts'
import bots from './bots'

const store = configureStore({
  reducer: { accounts, bots },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type Store = ReturnType<typeof store.getState>

export default store

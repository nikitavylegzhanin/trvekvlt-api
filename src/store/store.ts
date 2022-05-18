import { configureStore } from '@reduxjs/toolkit'

import logMiddleware from './logMiddleware'
import bots from './bots'

const store = configureStore({
  reducer: { bots },
  middleware: [logMiddleware],
})

export type Store = ReturnType<typeof store.getState>

export default store

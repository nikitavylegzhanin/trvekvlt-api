import { configureStore } from '@reduxjs/toolkit'

import bots from './bots'

const store = configureStore({
  reducer: { bots },
})

export type Store = ReturnType<typeof store.getState>

export default store

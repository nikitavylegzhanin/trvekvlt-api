import { configureStore } from '@reduxjs/toolkit'

import logMiddleware from './logMiddleware'
import config from './config'
import positions from './positions'
import levels from './levels'
import trends from './trends'

const store = configureStore({
  reducer: {
    config,
    positions,
    levels,
    trends,
  },
  middleware: [logMiddleware],
})

export type Store = ReturnType<typeof store.getState>

export default store

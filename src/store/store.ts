import { configureStore } from '@reduxjs/toolkit'

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
})

export type Store = ReturnType<typeof store.getState>

export default store

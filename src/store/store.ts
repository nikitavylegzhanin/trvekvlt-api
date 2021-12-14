import { configureStore } from '@reduxjs/toolkit'
import devToolsEnhancer from 'remote-redux-devtools'

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
  enhancers:
    process.env.NODE_ENV !== 'test'
      ? [devToolsEnhancer({ realtime: true, port: 8000 })]
      : undefined,
})

export type Store = ReturnType<typeof store.getState>

export default store

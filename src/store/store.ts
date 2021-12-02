import { configureStore } from '@reduxjs/toolkit'
import devToolsEnhancer from 'remote-redux-devtools'

import config from './config'
import positions from './positions'
import levels from './levels'
import trends from './trends'
import price, { middleware as priceMiddleware } from './price'

const store = configureStore({
  reducer: {
    config,
    positions,
    levels,
    trends,
    price,
  },
  enhancers:
    process.env.NODE_ENV !== 'test'
      ? [devToolsEnhancer({ realtime: true, port: 8000 })]
      : undefined,
  middleware: [priceMiddleware],
})

export type Store = ReturnType<typeof store.getState>

export default store

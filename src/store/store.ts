import { configureStore } from '@reduxjs/toolkit'
import devToolsEnhancer from 'remote-redux-devtools'

import logger from './logger'
import config from './config'
import positions from './positions'

const store = configureStore({
  reducer: {
    config,
    positions,
  },
  // enhancers: [devToolsEnhancer({ realtime: true, port: 8000 })],
  middleware: [logger],
})

export type Store = ReturnType<typeof store.getState>

export default store

import { configureStore } from '@reduxjs/toolkit'
import devToolsEnhancer from 'remote-redux-devtools'

import config from './config'
import positions from './positions'

export const store = configureStore({
  reducer: {
    config,
    positions,
  },
  enhancers: [devToolsEnhancer({ realtime: true, port: 8000 })],
})

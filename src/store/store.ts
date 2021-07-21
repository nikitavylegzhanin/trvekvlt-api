import { configureStore } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'

import config from './config'
import candles from './candles'

const logger = createLogger({
  level: {
    action: () => 'info',
  },
  actionTransformer: (action) => ({
    ...action,
    payload: JSON.stringify(action.payload),
  }),
})

export const store = configureStore({
  reducer: {
    config,
    candles,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
})

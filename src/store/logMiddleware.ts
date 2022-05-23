import { Middleware, PayloadAction } from '@reduxjs/toolkit'
import { pick } from 'ramda'

import { BotActionType, StoredBot } from './bots'
import { LogType } from '../db'
import { sendMessage } from '../telegram'

const formatMessage = (action: PayloadAction<any>) => {
  switch (action.type) {
    case BotActionType.INIT: {
      const { payload } = action as PayloadAction<StoredBot[]>

      return payload.reduce(
        (message, bot) =>
          message.concat(
            JSON.stringify(pick(['name', 'ticker', 'positions'], bot))
          ),
        ''
      )
    }
    default:
      return JSON.stringify(action.payload)
  }
}

const logMiddleware: Middleware = (_store) => (next) => (action) => {
  if (process.env.NODE_ENV !== 'test') {
    sendMessage(LogType.STATE, formatMessage(action))
  }

  return next(action)
}

export default logMiddleware

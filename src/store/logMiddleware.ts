import { Middleware } from '@reduxjs/toolkit'

import { LogType } from '../db'
import { sendMessage } from '../telegram'

const logMiddleware: Middleware = (_store) => (next) => (action) => {
  if (process.env.NODE_ENV !== 'test') {
    const type = LogType.STATE
    const message = JSON.stringify(action)

    sendMessage(type, message)
  }

  return next(action)
}

export default logMiddleware

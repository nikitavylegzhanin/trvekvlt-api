import { Middleware } from '@reduxjs/toolkit'
import { getConnection } from 'typeorm'

import { Log, LogType } from '../db'
import { sendMessage } from '../telegram'

const logMiddleware: Middleware = (_store) => (next) => (action) => {
  if (process.env.NODE_ENV !== 'test') {
    const type = LogType.STATE
    const message = JSON.stringify(action)

    sendMessage(type, message)

    const { manager } = getConnection()
    manager.save(
      manager.create(Log, {
        type,
        message,
      })
    )
  }

  return next(action)
}

export default logMiddleware

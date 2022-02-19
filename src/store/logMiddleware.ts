import { Middleware, PayloadAction } from '@reduxjs/toolkit'
import { getConnection } from 'typeorm'

import { ConfigActionType, EditConfigPayload } from './config'
import { LevelsActionType } from './levels'
import { TrendsActionType } from './trends'
import { Log, LogType } from '../db'
import { sendMessage } from '../notifications'

const isIgnoredEditConfigPayload = (payload: EditConfigPayload) => {
  const payloadKeys = Object.keys(payload)

  if (payloadKeys.length !== 1) return false

  switch (payloadKeys[0]) {
    case 'figi':
      return true
    default:
      return false
  }
}

const isIgnoredAction = (action: PayloadAction<any>) => {
  switch (action.type) {
    case ConfigActionType.EDIT:
      return isIgnoredEditConfigPayload(action.payload)
    case LevelsActionType.INIT_LEVELS:
    case TrendsActionType.INIT_TRENDS:
      return true
    default:
      return false
  }
}

const logMiddleware: Middleware = (_store) => (next) => (action) => {
  if (!isIgnoredAction(action) && process.env.NODE_ENV !== 'test') {
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

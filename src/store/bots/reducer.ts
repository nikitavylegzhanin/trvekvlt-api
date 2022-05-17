import { createReducer } from '@reduxjs/toolkit'

import { Bot } from '../../db'
import { initBots, editBot, addData, editData, removeData } from './actions'

const payloadDataKeys = ['level', 'position', 'trend']
type botDataValue = Bot['levels'][0] | Bot['positions'][0] | Bot['trends'][0]

export type StoredBot = Bot & {
  figi: string
  startDate: Date
  endDate: Date
}

const reducer = createReducer<StoredBot[]>([], (builder) =>
  builder
    .addCase(initBots, (_bots, action) => action.payload)
    .addCase(editBot, (bots, action) =>
      bots.map((bot) =>
        bot.id === action.payload.id ? { ...bot, ...action.payload } : bot
      )
    )
    .addCase(addData, (bots, action) =>
      bots.map((bot) =>
        bot.id === action.payload.botId
          ? {
              ...bot,
              ...payloadDataKeys
                .map((key: 'level' | 'position' | 'trend') =>
                  action.payload[key]
                    ? {
                        [`${key}s`]: [...bot[`${key}s`], action.payload[key]],
                      }
                    : undefined
                )
                .reduce((obj, item) => ({ ...obj, ...item }), {}),
            }
          : bot
      )
    )
    .addCase(editData, (bots, action) =>
      bots.map((bot) =>
        bot.id === action.payload.botId
          ? {
              ...bot,
              ...payloadDataKeys
                .map((key: 'level' | 'position' | 'trend') =>
                  action.payload[key]
                    ? {
                        [`${key}s`]: bot[`${key}s`].map((value: botDataValue) =>
                          value.id === action.payload[key].id
                            ? { ...value, ...action.payload[key] }
                            : value
                        ),
                      }
                    : undefined
                )
                .reduce((obj, item) => ({ ...obj, ...item }), {}),
            }
          : bot
      )
    )
    .addCase(removeData, (bots, action) =>
      bots.map((bot) =>
        bot.id === action.payload.botId
          ? {
              ...bot,
              ...payloadDataKeys.map((key: 'level' | 'position' | 'trend') => ({
                [`${key}s`]: bot[`${key}s`].filter(
                  (value: botDataValue) => value.id !== action.payload[key].id
                ),
              })),
            }
          : bot
      )
    )
)

export default reducer

import { createConnection, getConnection } from 'typeorm'

import { Bot } from './Bot'
import { Level } from './Level'
import { Trend } from './Trend'
import { Position } from './Position'
import { Log } from './Log'

const url = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@bot-dev.postgres.database.azure.com/postgres?sslmode=require`

export const connect = () =>
  createConnection({
    type: 'postgres',
    url,
    entities: [Bot, Level, Trend, Position, Log],
    synchronize: true,
  })

export const close = () => getConnection().close()

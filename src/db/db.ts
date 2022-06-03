import { DataSource } from 'typeorm'

import { Bot } from './Bot'
import { Level } from './Level'
import { Trend } from './Trend'
import { Position } from './Position'
import { Log } from './Log'

const db = new DataSource({
  type: 'postgres',
  host: process.env.HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'postgres',
  entities: [Bot, Level, Trend, Position, Log],
  synchronize: true,
})

export default db

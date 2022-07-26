import { DataSource } from 'typeorm'
import { readFileSync } from 'fs'

import { Bot } from './Bot'
import { Level } from './Level'
import { Trend } from './Trend'
import { Position } from './Position'
import { Order } from './Order'
import { Log } from './Log'

const ca = readFileSync('./ssl/CA.pem')

const db = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Bot, Level, Trend, Position, Order, Log],
  synchronize: true,
  ssl: {
    ca,
    rejectUnauthorized: false,
  },
})

export default db

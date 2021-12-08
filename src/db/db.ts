import { ConnectionManager } from 'typeorm'

import { Level } from './Level'
import { Trend } from './Trend'
import { Position } from './Position'

const connectionManager = new ConnectionManager()

const db = connectionManager.create({
  type: 'better-sqlite3',
  database: 'test.db',
  entities: [Level, Trend, Position],
  synchronize: true,
})

export default db

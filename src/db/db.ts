import { createConnection } from 'typeorm'

import { Level } from './Level'
import { Trend } from './Trend'
import { Position } from './Position'

export const connect = () =>
  createConnection({
    type: 'better-sqlite3',
    database: 'test.db',
    entities: [Level, Trend, Position],
    synchronize: true,
  })

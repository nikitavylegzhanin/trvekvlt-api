import { Config } from 'apollo-server'

import db, { Bot } from '../../db'

export const bots: Config['fieldResolver'] = () =>
  db.manager.find(Bot, {
    relations: ['levels'],
  })

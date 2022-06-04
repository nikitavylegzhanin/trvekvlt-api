import { Config } from 'apollo-server'

import { Context } from './'
import db, { Log } from '../db'

const resolvers: Config['resolvers'] = {
  Query: {
    state: (_parent, _args, { store }: Context) => {
      const state = store.getState()

      return state
    },
    log: () => db.manager.find(Log),
    bots: (_parent, _args, { store }: Context) => {
      const state = store.getState()

      return state.bots
    },
  },
}

export default resolvers

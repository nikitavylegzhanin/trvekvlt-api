import { Config } from 'apollo-server'
import { getConnection } from 'typeorm'

import { Context } from './'
import { Log } from '../db'

const resolvers: Config['resolvers'] = {
  Query: {
    state: (_parent, _args, { store }: Context) => {
      const state = store.getState()

      return state
    },
    log: () => {
      const { manager } = getConnection()

      return manager.find(Log)
    },
  },
}

export default resolvers

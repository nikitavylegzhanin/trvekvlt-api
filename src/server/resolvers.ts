import { Config } from 'apollo-server'

import { Context } from './'

const resolvers: Config['resolvers'] = {
  Query: {
    state: (_parent, _args, { store }: Context) => {
      const state = store.getState()

      return state
    },
  },
}

export default resolvers

import { ApolloServer, gql } from 'apollo-server'

import store from './store'

const typeDefs = gql`
  type StoreConfig {
    ticker: String
    figi: String
    isDisabled: Boolean
    isSandbox: Boolean
  }

  type Store {
    config: StoreConfig
  }

  type Query {
    store: Store
  }
`

const context = { store }

type Context = typeof context

const resolvers = {
  Query: {
    store: (_parent: any, _args: any, { store }: Context) => {
      const { config } = store.getState()

      return { config }
    },
  },
}

export const startServer = () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context,
  })

  return server.listen({ port: process.env.PORT })
}

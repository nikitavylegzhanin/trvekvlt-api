import { ApolloServer, ServerInfo } from 'apollo-server'

import typeDefs from './typeDefs'
import { state, log, bots, positions, chart } from './resolvers'

export const startServer = () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        state,
        log,
        bots,
        positions,
        chart,
      },
    },
  })

  return server.listen({ port: process.env.PORT })
}

export const logUrl = ({ url }: ServerInfo) =>
  console.log(`Server ready at ${url}`)

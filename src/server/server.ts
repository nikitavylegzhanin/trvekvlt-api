import 'reflect-metadata'
import { ApolloServer, ServerInfo } from 'apollo-server'
import { buildSchema } from 'type-graphql'

import resolvers from './resolvers'

export const startServer = async () => {
  const schema = await buildSchema({
    resolvers,
  })

  const server = new ApolloServer({ schema })

  return server.listen({ port: process.env.PORT })
}

export const logUrl = ({ url }: ServerInfo) =>
  console.log(`Server ready at ${url}`)

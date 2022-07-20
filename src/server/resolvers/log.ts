import { Resolver, Query } from 'type-graphql'

import db, { Log } from '../../db'

@Resolver()
export class LogResolver {
  @Query(() => [Log])
  log() {
    return db.manager.find(Log)
  }
}

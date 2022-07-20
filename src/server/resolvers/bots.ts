import { Resolver, Query } from 'type-graphql'

import db, { Bot } from '../../db'

@Resolver()
export class BotsResolver {
  @Query(() => [Bot])
  bots() {
    return db.manager.find(Bot, {
      relations: ['levels'],
    })
  }
}

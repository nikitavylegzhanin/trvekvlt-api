import { Resolver, Query, ObjectType, Field, Float } from 'type-graphql'

import store from '../../store'
import { Bot } from '../../db'

@ObjectType()
class StoredBot extends Bot {
  @Field(() => String)
  figi: string

  @Field(() => Date)
  startDate: Date

  @Field(() => Date)
  endDate: Date

  @Field(() => Boolean)
  isShortEnable: boolean

  @Field(() => Float)
  tickValue: number
}

@Resolver()
export class StateResolver {
  @Query(() => [StoredBot])
  storedBots(): StoredBot[] {
    const { bots } = store.getState()

    return bots
  }
}

import { Resolver, Query, ObjectType, Field, Float } from 'type-graphql'

import store from '../../store'
import { Bot } from '../../db'

@ObjectType()
class StoredBot extends Bot {
  @Field(() => String)
  figi: string

  @Field(() => Date, { nullable: true })
  startDate: Date

  @Field(() => Date, { nullable: true })
  endDate: Date

  @Field(() => Boolean)
  isShortEnable: boolean

  @Field(() => Float)
  tickValue: number

  @Field(() => Boolean)
  isProcessing: boolean

  @Field(() => Float, { nullable: true })
  lastPrice?: number
}

@Resolver()
export class StateResolver {
  @Query(() => [StoredBot])
  storedBots(): StoredBot[] {
    const { bots } = store.getState()

    return bots
  }
}

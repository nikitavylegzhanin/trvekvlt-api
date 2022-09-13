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

@ObjectType()
class StoredAccount {
  @Field(() => String)
  id: string

  @Field(() => String)
  name: string

  @Field(() => Boolean)
  isFullAccess: boolean

  @Field(() => Boolean)
  isSandbox: boolean

  @Field(() => Float, { nullable: true })
  liquidPortfolio?: number
}

@Resolver()
export class StateResolver {
  @Query(() => [StoredBot])
  storedBots(): StoredBot[] {
    const { bots } = store.getState()

    return bots
  }

  @Query(() => [StoredAccount])
  storedAccounts(): StoredAccount[] {
    const { accounts } = store.getState()

    return accounts
  }
}

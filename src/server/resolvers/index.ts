import { NonEmptyArray } from 'type-graphql'

import { StateResolver } from './state'
import { LogResolver } from './log'
import { BotsResolver } from './bots'
import { PositionsResolver } from './positions'
import { ChartResolver } from './chart'
import { LevelsResolver } from './levels'

const resolvers: NonEmptyArray<Function> = [
  StateResolver,
  LogResolver,
  PositionsResolver,
  BotsResolver,
  ChartResolver,
  LevelsResolver,
]

export default resolvers

import { gql } from 'apollo-server'

const typeDefs = gql`
  scalar Date

  enum LevelStatus {
    ACTIVE
    DISABLED_DURING_SESSION
    DISABLED
  }

  type Level {
    id: ID
    value: Float
    status: LevelStatus
    createdAt: Date
    updatedAt: Date
  }

  enum PositionStatus {
    OPENING
    OPEN_PARTIAL
    OPEN_FULL
    CLOSING
    CLOSED
  }

  enum PositionOpeningRule {
    BEFORE_LEVEL_3TICKS
    ON_LEVEL
    AFTER_LEVEL_3TICKS
  }

  type Order {
    date: Date
    price: Float
    currency: String
    quantity: Int
    direction: String
    orderType: String
  }

  enum PositionClosingRule {
    SL
    TP
    SLT_3TICKS
    SLT_50PERCENT
    MARKET_PHASE_END
    TIME_BREAK
  }

  type Position {
    id: ID
    status: PositionStatus
    openedByRules: [PositionOpeningRule]
    orders: [Order]
    closingRules: [PositionClosingRule]
    closedByRule: PositionClosingRule
    createdAt: Date
    updatedAt: Date
  }

  enum TrendDirection {
    UP
    DOWN
  }

  enum TrendType {
    MANUAL
    CORRECTION
  }

  type Trend {
    id: ID
    direction: TrendDirection
    type: TrendType
    createdAt: Date
    updatedAt: Date
  }

  enum BotStatus {
    RUNNING
    DISABLED_DURING_SESSION
    DISABLED
  }

  type StoredBot {
    id: ID
    accountId: String
    name: String
    ticker: String
    figi: String
    startDate: Date
    endDate: Date
    status: BotStatus
    createdAt: Date
    updatedAt: Date
    levels: [Level]
    positions: [Position]
    trends: [Trend]
  }

  type State {
    bots: [StoredBot]
  }

  type Log {
    id: ID
    message: String
    createdAt: Date
  }

  type Query {
    state: State
    log: [Log]
  }
`

export default typeDefs

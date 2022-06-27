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

  type Order {
    id: ID
    price: Float
    currency: String
    quantity: Int
    direction: String
    type: String
    rule: String
    createdAt: Date
    updatedAt: Date
    position: Position
  }

  type Position {
    id: ID
    status: String
    availableRules: [String]
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
    isShortEnable: Boolean
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

  type Candle {
    date: Date
    low: Float
    open: Float
    close: Float
    high: Float
    volume: Int
  }

  type Chart {
    candles: [Candle]
    trends: [Trend]
    orders: [Order]
  }

  type Instrument {
    figi: String
    ticker: String
    name: String
  }

  type Operation {
    id: ID
    parentOperationId: ID
    currency: String
    payment: Float
    price: Float
    quantity: Int
    date: Date
    type: String
    operationType: String
  }

  type PositionProfit {
    usd: Float
    percent: Float
  }

  type Position {
    closedAt: Date
    instrument: Instrument
    profit: PositionProfit
    operations: [Operation]
  }

  type Query {
    state: State
    log: [Log]
    bots: [StoredBot]
    chart(botId: ID!, from: Date!, to: Date!, interval: Int): Chart
    positions(from: Date!, to: Date!): [Position]
  }
`

export default typeDefs

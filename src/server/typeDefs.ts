import { gql } from 'apollo-server'

const typeDefs = gql`
  scalar Date

  type StoredConfig {
    ticker: String
    figi: String
    isDisabled: Boolean
    isSandbox: Boolean
  }

  type StoredLevel {
    id: ID
    value: Float
    # isDisabled: Boolean
  }

  enum PositionStatus {
    OPENING
    OPEN
    CLOSING
    CLOSED
  }

  enum PositionClosingRule {
    SL
    TP
    SLT_3TICKS
    SLT_50PERCENT
    MARKET_PHASE_END
  }

  type StoredPosition {
    id: ID
    status: PositionStatus
    closingRules: [PositionClosingRule]
    openLevelId: ID
    closedByRule: PositionClosingRule
    closedLevelId: ID
  }

  enum TrendDirection {
    UP
    DOWN
  }

  enum TrendType {
    MANUAL
    CORRECTION
  }

  type StoredTrend {
    id: ID
    direction: TrendDirection
    type: TrendType
  }

  type State {
    config: StoredConfig
    levels: [StoredLevel]
    positions: [StoredPosition]
    trends: [StoredTrend]
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

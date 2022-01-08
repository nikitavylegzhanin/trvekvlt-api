import { gql } from 'apollo-server'

const typeDefs = gql`
  type StoredConfig {
    ticker: String
    figi: String
    isDisabled: Boolean
    isSandbox: Boolean
  }

  type StoredLevel {
    id: ID
    value: Float
    isDisabled: Boolean
  }

  # enum PositionStatus
  # enum PositionClosingRule

  type StoredPosition {
    id: ID
    status: Int
    closingRules: [Int]
    openLevelId: ID
    closedByRule: Int
    closedLevelId: ID
  }

  type StoredTrend {
    id: ID
    direction: Int
    type: Int
  }

  type State {
    config: StoredConfig
    levels: [StoredLevel]
    positions: [StoredPosition]
    trends: [StoredTrend]
  }

  type Query {
    state: State
  }
`

export default typeDefs

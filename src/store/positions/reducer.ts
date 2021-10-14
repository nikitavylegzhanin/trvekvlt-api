import { createReducer } from '@reduxjs/toolkit'
import type { Operation } from '@tinkoff/invest-openapi-js-sdk'

import { addOperations } from './actions'
import { getComplited, byDateAsc, groupByQt, toPositions } from './utils'

export enum Direction {
  LONG = 'Buy',
  SHORT = 'Sell',
}

export type Position = {
  operations: Operation[]
  direction: Direction
  qt: number
  avgPrice: number
  result: {
    usd: number
    percentage: number
  }
  isClosed: boolean
}

const reducer = createReducer<Position[]>([], (builder) =>
  builder.addCase(addOperations, (_, action) =>
    action.payload
      .slice(0, -2) // Development
      .filter(getComplited)
      .sort(byDateAsc)
      .reduce(groupByQt, [[]])
      .map(toPositions)
  )
)

export default reducer

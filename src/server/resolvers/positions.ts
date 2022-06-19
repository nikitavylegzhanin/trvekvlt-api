import { Config } from 'apollo-server'
import { propEq } from 'ramda'

import {
  getInstrumentByFigi,
  getAccounts,
  getOpenPositions,
  getOperations,
  Operation,
  PortfolioPosition,
} from '../../api'

const isShares = (portfolioPosition: PortfolioPosition) =>
  portfolioPosition.instrumentType === 'share'

const isBuyOrSellOperation = (operation: Operation) =>
  ['OPERATION_TYPE_BUY', 'OPERATION_TYPE_SELL'].includes(
    operation.operationType
  )

const sumWithBrokerFee = (
  operation: Operation,
  _index: number,
  operations: Operation[]
) => {
  if (isBuyOrSellOperation(operation)) {
    const brokerFeeOperation = operations.find(
      propEq('parentOperationId', operation.id)
    )

    if (brokerFeeOperation) {
      operation.payment = operation.payment + brokerFeeOperation.payment
    }
  }

  return operation
}

const groupByFigi = (arr: Operation[][], operation: Operation) => {
  const index = arr.findIndex((values) =>
    values.some(({ figi }) => figi === operation.figi)
  )

  if (index === -1) {
    return [...arr, [operation]]
  }

  arr[index].push(operation)
  return arr
}

const isClosedOperations =
  (openPortfolioPositions: PortfolioPosition[]) =>
  (operation: Operation, index: number, operations: Operation[]) => {
    const openPortfolioPosition = openPortfolioPositions.find(
      propEq('figi', operation.figi)
    )

    if (openPortfolioPosition) {
      const operationsQt = operations
        .slice(0, index)
        .reduce((sum, { quantity }) => sum + quantity, 0)

      if (operationsQt <= openPortfolioPosition.quantity) {
        return false
      }
    }

    return true
  }

const getOperationPaymentUsd = (operation: Operation) =>
  operation.currency === 'usd' ? operation.payment : 0 // TODO: convert to usd

const getStartedPosition = (operation: Operation): Position => ({
  isClosed: false,
  instrument: {
    figi: operation.figi,
  },
  profit: { usd: getOperationPaymentUsd(operation), percent: 0 },
  operations: [operation],
})

const groupByPositions = (positions: Position[], operation: Operation) => {
  if (!positions.length) return [getStartedPosition(operation)]

  const lastPosition = positions[positions.length - 1]
  const lastPositionQt = lastPosition.operations.reduce(
    (sum, operation) =>
      sum +
      operation.quantity *
        (operation.operationType === 'OPERATION_TYPE_SELL' ? -1 : 1),
    0
  )

  if (!lastPositionQt) {
    const paymentBuySum = lastPosition.operations
      .filter(propEq('operationType', 'OPERATION_TYPE_BUY'))
      .reduce((sum, operation) => sum + operation.payment, 0)
    const paymentSellSum = lastPosition.operations
      .filter(propEq('operationType', 'OPERATION_TYPE_SELL'))
      .reduce((sum, operation) => sum + operation.payment, 0)

    lastPosition.profit.percent =
      (100 / (Math.abs(paymentBuySum) / paymentSellSum) - 100) * 0.01
    lastPosition.isClosed = true

    return [...positions, getStartedPosition(operation)]
  }

  lastPosition.profit = {
    usd: lastPosition.profit.usd + getOperationPaymentUsd(operation),
    percent: 0,
  }
  lastPosition.operations.push(operation)

  return positions
}

const addInstrumentData = async (positions: Position[]) => {
  const instrument = await getInstrumentByFigi(positions[0].instrument.figi)

  return positions.map((value) => ({ ...value, instrument }))
}

type Args = {
  from: Date
  to: Date
}

type Position = {
  isClosed: boolean
  instrument: {
    figi: string
    ticker?: string
    name?: string
  }
  profit: {
    usd: number
    percent: number
  }
  operations: Operation[]
}

export const positions: Config['fieldResolver'] = async (
  _parent,
  args: Args
) => {
  const from = new Date(args.from)
  const to = new Date(args.to)

  const [account] = await getAccounts()
  const openPortfolioPositions = await getOpenPositions(account.id)
  const allOperations = await getOperations(account.id, from, to, 1)

  const positions = allOperations
    .map(sumWithBrokerFee)
    .filter(isBuyOrSellOperation)
    .filter(isClosedOperations(openPortfolioPositions.filter(isShares)))
    .reduce(groupByFigi, [])
    .map((values) => values.reduce(groupByPositions, []))
    .map((values) => values.filter(propEq('isClosed', true)))
    .filter((values) => values.length)

  const positionsWithInstrumentData = await Promise.all(
    positions.map(addInstrumentData)
  )

  return positionsWithInstrumentData.reduce(
    (arr, value) => [...arr, ...value],
    []
  )
}

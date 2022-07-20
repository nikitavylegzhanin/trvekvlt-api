import {
  Resolver,
  Query,
  Arg,
  ObjectType,
  Field,
  Float,
  Int,
  ID,
} from 'type-graphql'
import { propEq } from 'ramda'

import {
  getInstrumentByFigi,
  getAccounts,
  getOpenPositions,
  getOperations,
  PortfolioPosition,
} from '../../api'

@ObjectType()
class Instrument {
  @Field(() => String)
  figi: string

  @Field(() => String, { nullable: true })
  ticker?: string

  @Field(() => String, { nullable: true })
  name?: string
}

@ObjectType()
class Profit {
  @Field(() => Float)
  usd: number

  @Field(() => Float)
  percent: number
}

@ObjectType()
class Operation {
  @Field(() => ID)
  id: string
  @Field(() => String)
  figi: string
  @Field(() => String)
  parentOperationId: string
  @Field(() => String)
  currency: string
  @Field(() => Float)
  payment: number
  @Field(() => Float)
  price: number
  @Field(() => Int)
  quantity: number
  @Field(() => Date)
  date: Date
  @Field(() => String)
  type: string
  @Field(() => String)
  operationType: string
}

@ObjectType()
class ManualPosition {
  @Field(() => Boolean)
  isClosed: boolean

  @Field(() => Date)
  closedAt: Date

  @Field(() => Instrument)
  instrument: Instrument

  @Field(() => Profit)
  profit: Profit

  @Field(() => [Operation])
  operations: Operation[]
}

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

const getStartedPosition = (operation: Operation): ManualPosition => ({
  isClosed: false,
  closedAt: null,
  instrument: {
    figi: operation.figi,
  },
  profit: { usd: getOperationPaymentUsd(operation), percent: 0 },
  operations: [operation],
})

const calcOperationsQt = (sum: number, operation: Operation) =>
  sum +
  operation.quantity *
    (operation.operationType === 'OPERATION_TYPE_SELL' ? -1 : 1)

const calcOperationsPayment = (sum: number, operation: Operation) =>
  sum + operation.payment

const groupByPositions = (
  positions: ManualPosition[],
  operation: Operation
) => {
  if (!positions.length) return [getStartedPosition(operation)]

  const lastPosition = positions[positions.length - 1]
  if (lastPosition.isClosed)
    return [...positions, getStartedPosition(operation)]

  lastPosition.profit.usd =
    lastPosition.profit.usd + getOperationPaymentUsd(operation)
  lastPosition.operations.push(operation)

  const lastPositionQt = lastPosition.operations.reduce(calcOperationsQt, 0)

  if (!lastPositionQt) {
    const paymentBuySum = lastPosition.operations
      .filter(propEq('operationType', 'OPERATION_TYPE_BUY'))
      .reduce(calcOperationsPayment, 0)
    const paymentSellSum = lastPosition.operations
      .filter(propEq('operationType', 'OPERATION_TYPE_SELL'))
      .reduce(calcOperationsPayment, 0)

    lastPosition.profit.percent =
      (100 / (Math.abs(paymentBuySum) / paymentSellSum) - 100) * 0.01
    lastPosition.isClosed = true
    lastPosition.closedAt = lastPosition.operations[0].date
  }

  return positions
}

const addInstrumentInfo = async (positions: ManualPosition[]) => {
  const instrument = await getInstrumentByFigi(positions[0].instrument.figi)

  return positions.map((value) => ({ ...value, instrument }))
}

@Resolver()
export class PositionsResolver {
  @Query(() => [ManualPosition])
  async positions(
    @Arg('from') from: Date,
    @Arg('to') to: Date
  ): Promise<ManualPosition[]> {
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

    const positionsWithInstrumentInfo = await Promise.all(
      positions.map(addInstrumentInfo)
    )

    return positionsWithInstrumentInfo.reduce(
      (arr, value) => [...arr, ...value],
      []
    )
  }
}

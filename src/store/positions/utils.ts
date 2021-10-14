import { parseISO } from 'date-fns'
import type { Operation } from '@tinkoff/invest-openapi-js-sdk'

import { Position, Direction } from './reducer'

export const getComplited = ({ status, operationType }: Operation) =>
  status === 'Done' && Object.values<string>(Direction).includes(operationType)

export const byDateAsc = (a: Operation, b: Operation) =>
  parseISO(a.date).getTime() - parseISO(b.date).getTime()

export const groupByQt = (
  positions: Operation[][],
  operation: Operation,
  index: number,
  arr: Operation[]
) => {
  const isLast = !arr[index + 1]
  const position = positions[positions.length - 1]

  position.push(operation)

  const qtSum = position.reduce(
    (value, { quantityExecuted, operationType }) =>
      value + quantityExecuted * (operationType === 'Sell' ? -1 : 1),
    0
  )

  if (!isLast && qtSum === 0) positions.push([])

  return positions
}

const getDirectionByOperationType = (
  operationType: Operation['operationType']
) => (operationType === 'Buy' ? Direction.LONG : Direction.SHORT)

const getPaymentSum = (usd: number, { payment, commission }: Operation) =>
  usd + payment + commission.value

const getPriceSum = (avgPrice: number, { price }: Operation) => avgPrice + price

const getQt = (qt: number, { quantityExecuted }: Operation) =>
  qt + quantityExecuted

export const toPositions = (operations: Operation[]): Position => {
  const direction = getDirectionByOperationType(operations[0].operationType)
  const inDirection = operations.filter(
    ({ operationType }) => operationType === direction
  )
  const avgPrice = inDirection.reduce(getPriceSum, 0) / inDirection.length
  const qt = inDirection.reduce(getQt, 0)
  const usd = operations.reduce(getPaymentSum, 0)

  return {
    operations,
    direction,
    qt,
    avgPrice,
    result: {
      usd,
      percentage: usd / (qt * avgPrice),
    },
    isClosed: qt === operations.reduce(getQt, 0) / 2,
  }
}

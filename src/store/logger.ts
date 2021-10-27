import { Middleware } from '@reduxjs/toolkit'
import isEqual from 'lodash.isequal'
import Table from 'cli-table'
import { format, parseISO, formatDistanceStrict } from 'date-fns'

import { Store } from './store'
import { Position, ActionTypes } from './positions'

const FORMAT = 'HH:mm:ss'

const getDate = (operations: Position['operations']) => {
  const from = parseISO(operations[0].date)
  const to = parseISO(operations[operations.length - 1].date)

  return [
    format(from, FORMAT),
    '-',
    format(to, FORMAT),
    formatDistanceStrict(from, to),
  ].join(' ')
}

const getFooterDate = (positions: Position[]) => {
  const from = parseISO(positions[0].operations[0].date)
  const lastPositionIndex = positions.length - 1
  const to = parseISO(
    positions[lastPositionIndex].operations[
      positions[lastPositionIndex].operations.length - 1
    ].date
  )

  return formatDistanceStrict(from, to)
}

const getTable = (positions: Position[]) => {
  const table = new Table({
    head: ['date', 'direction', 'qt', 'avgPrice', 'usd', '%'],
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '|',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '|',
      'right-mid': '',
      middle: '|',
    },
  })

  table.push(
    [':--', ':--', ':--', ':--', ':--', ':--'],
    ...positions.map((position) => [
      getDate(position.operations),
      position.direction === 'Buy' ? 'Long' : 'Short',
      position.qt,
      position.avgPrice.toFixed(2),
      position.result.usd.toFixed(2),
      (position.result.percentage * 100).toFixed(2),
    ]),
    // prettier-ignore
    [
      positions.length ? getFooterDate(positions) : '',
      '', '', '',
      positions.reduce((sum, { result }) => sum + result.usd, 0).toFixed(2),
      (positions.reduce((sum, { result }) => sum + result.percentage, 0) * 100).toFixed(2),
    ]
  )

  return table.toString()
}

const getOpenPositionData = (position?: Position) => {
  if (!position) return []

  return [position.direction, position.qt, position.avgPrice]
}

const closedPosition = ({ isClosed }: Position) => isClosed
const openPosition = ({ isClosed }: Position) => !isClosed

const logger: Middleware = (store) => (next) => (action) => {
  if (action.type === ActionTypes.ADD_OPERATIONS) {
    const previous = store.getState() as Store
    const result = next(action)
    const { positions } = store.getState() as Store

    if (!isEqual(previous.positions, positions)) {
      const table = getTable(positions.filter(closedPosition))
      const openPositionData = getOpenPositionData(positions.find(openPosition))

      console.log(table, '\n\n', ...openPositionData)
    }

    return result
  }

  return next(action)
}

export default logger

import Table from 'cli-table'
import { format, parseISO, formatDistanceStrict } from 'date-fns'

import { Position } from './store/positions/reducer'

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

const onlyClosed = ({ isClosed }: Position) => isClosed

export const toTable = (positions: Position[]) => {
  const closed = positions.filter(onlyClosed)

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
    ...closed.map((position) => [
      getDate(position.operations),
      position.direction === 'Buy' ? 'Long' : 'Short',
      position.qt,
      position.avgPrice.toFixed(2),
      position.result.usd.toFixed(2),
      (position.result.percentage * 100).toFixed(2),
    ]),
    // prettier-ignore
    [
      getFooterDate(closed),
      '', '', '',
      closed.reduce((sum, { result }) => sum + result.usd, 0).toFixed(2),
      (closed.reduce((sum, { result }) => sum + result.percentage, 0) * 100).toFixed(2),
    ]
  )

  console.log(table.toString())
}

import { parseISO, setDay, format, getWeekOfMonth } from 'date-fns'
import Table from 'cli-table'

import store from './store'

type Result = { day: number; usd: number; percentage: number }

const logReport = (date: Date, results: Result[]) => {
  const table = new Table({
    head: ['date', 'usd', '%'],
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
    [':--', ':--', ':--'],
    ...results.map((result) => [
      format(setDay(date, result.day), 'EEEE'),
      result.usd.toFixed(2),
      (result.percentage * 100).toFixed(2),
    ]),
    [
      `${format(date, 'MMM yy')}: ${getWeekOfMonth(date)}`,
      results.reduce((sum, { usd }) => sum + usd, 0).toFixed(2),
      (
        (results.reduce((sum, { percentage }) => sum + percentage, 0) /
          results.length) *
        100
      ).toFixed(2),
    ]
  )

  return table.toString()
}

export const getWeeklyReport = async () => {
  const { positions } = store.getState()

  const results = positions.reduce<Result[]>((results, position) => {
    const result = results[results.length - 1]

    if (result) {
      const { day } = result

      const isSameDay = position.operations.some(
        (operation) => parseISO(operation.date).getDay() === day
      )

      if (isSameDay) {
        const next = [
          ...results.slice(0, -1),
          {
            ...result,
            usd: result.usd + position.result.usd,
            percentage: result.percentage + position.result.percentage,
          },
        ]

        return next
      }
    }

    return [
      ...results,
      {
        ...position.result,
        day: parseISO(position.operations[0].date).getDay(),
      },
    ]
  }, [])

  return logReport(parseISO(positions[0].operations[0].date), results)
}

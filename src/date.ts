import { startOfToday, endOfToday, set } from 'date-fns'

const getDate = () => {
  const date = parseInt(process.env.DATE)

  return Number.isNaN(date) ? undefined : date
}

export const getLastTradingSession = () => {
  const date = getDate()
  const from = set(startOfToday(), { date }).toISOString()
  const to = set(endOfToday(), { date }).toISOString()

  return { from, to }
}

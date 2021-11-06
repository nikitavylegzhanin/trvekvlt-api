import { startOfToday, endOfToday, set, startOfWeek, endOfWeek } from 'date-fns'

const getDate = () => {
  const date = parseInt(process.env.DATE)

  return Number.isNaN(date) ? undefined : date
}

export type SessionDate = { from: string; to: string }

export const getLastTradingDaySession = (): SessionDate => {
  const date = getDate()
  const from = set(startOfToday(), { date }).toISOString()
  const to = set(endOfToday(), { date }).toISOString()

  return { from, to }
}

export const getLastTradingWeekSession = (): SessionDate => {
  const date = set(new Date(), { date: getDate() })
  const weekStartsOn = 1

  const from = startOfWeek(date, { weekStartsOn }).toISOString()
  const to = endOfWeek(date, { weekStartsOn }).toISOString()

  return { from, to }
}

import { startOfToday, set } from 'date-fns'

export const getOpenPhaseDate = () => {
  const today = startOfToday()
  const from = set(today, { hours: 16, minutes: 30 }).toISOString()
  const to = set(today, { hours: 23 }).toISOString()

  return { from, to }
}

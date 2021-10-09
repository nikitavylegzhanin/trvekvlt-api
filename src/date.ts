import { startOfToday, endOfToday, set } from 'date-fns'

export const getLastTradingSession = () => {
  const from = set(startOfToday(), {
    //
  }).toISOString()
  const to = set(endOfToday(), {
    //
  }).toISOString()

  return { from, to }
}

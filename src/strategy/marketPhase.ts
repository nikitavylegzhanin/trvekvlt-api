type MarketPhaseInterval = [number, number, number, number]

const OPEN_MARKET_PHASE_INTERVALS = {
  start: [17, 49, 59, 0] as MarketPhaseInterval,
  end: [22, 59, 59, 0] as MarketPhaseInterval,
}

export const isTradingInterval = (date: Date) => {
  const startTime = new Date(date).setHours(
    ...OPEN_MARKET_PHASE_INTERVALS.start
  )
  const endTime = new Date(date).setHours(...OPEN_MARKET_PHASE_INTERVALS.end)
  const time = date.getTime()

  return time >= startTime && time <= endTime
}

export const getOpenMarketPhaseInterval = () => {
  return {
    from: new Date(
      new Date().setHours(...OPEN_MARKET_PHASE_INTERVALS.start)
    ).toISOString(),
    to: new Date(
      new Date().setHours(...OPEN_MARKET_PHASE_INTERVALS.end)
    ).toISOString(),
  }
}

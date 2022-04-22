type MarketPhase = {
  start: [number, number, number]
  end: [number, number, number]
}

const TIME_OUT_MIN = 30

const OPEN_MARKET_PHASE_INTERVALS: MarketPhase = {
  start: [10, 0 + TIME_OUT_MIN, 1],
  end: [18, 39 - TIME_OUT_MIN, 59],
}

const TIME_BREAK: MarketPhase = {
  start: [13, 49, 59],
  end: [14, 5, 1],
}

const getStartTime = (date: Date) =>
  new Date(date).setHours(...OPEN_MARKET_PHASE_INTERVALS.start, 0)

const getEndTime = (date: Date) =>
  new Date(date).setHours(...OPEN_MARKET_PHASE_INTERVALS.end, 0)

export const isTimeBreak = (date: Date) => {
  const startTime = new Date(date).setHours(...TIME_BREAK.start, 0)
  const endTime = new Date(date).setHours(...TIME_BREAK.end, 0)
  const time = date.getTime()

  return time >= startTime && time <= endTime
}

export const isTradingInterval = (date: Date) => {
  const startTime = getStartTime(date)
  const endTime = getEndTime(date)
  const time = date.getTime()

  return time >= startTime && time <= endTime
}

export const getOpenMarketPhaseInterval = () => {
  const date = new Date()

  return {
    from: new Date(getStartTime(date)).toISOString(),
    to: new Date(getEndTime(date)).toISOString(),
  }
}

import { Level } from '../levels/reducer'

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

export const isLastLevel = (levelId: string, levels: Level[]) => {
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value)
  const levelIndex = sortedLevels.findIndex(({ id }) => id === levelId)

  return levelIndex === 0 || levelIndex === sortedLevels.length - 1
}

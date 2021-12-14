import { StoredTrend } from '../../store/trends'
import { TrendDirection } from '../../db/Trend'
import { StoredLevel } from '../../store/levels'

export const getLastPrice = (ask: number, bid: number, trend: StoredTrend) =>
  trend.direction === TrendDirection.UP ? bid : ask

const getClosestLevelToLastPrice = (lastPrice: number) => (
  a: StoredLevel,
  b: StoredLevel
) => (Math.abs(b.value - lastPrice) < Math.abs(a.value - lastPrice) ? b : a)

export const getPriceDistanceToPrevLevel = (
  levels: StoredLevel[],
  lastPrice: number,
  openLevel: StoredLevel,
  closedLevel: StoredLevel
) => {
  const positionLevel = closedLevel || openLevel

  if (!positionLevel || lastPrice === positionLevel.value) return 0

  const closestLevel1 = levels.reduce(getClosestLevelToLastPrice(lastPrice))
  const closestLevel2 = levels
    .filter((level) => level.id !== closestLevel1.id)
    .reduce(getClosestLevelToLastPrice(lastPrice))
  const closestValues = [closestLevel1.value, closestLevel2.value]

  const min = Math.min(...closestValues)
  const max = Math.max(...closestValues)

  const distance1 = max - min
  const distance2 = lastPrice - min
  const distance = distance2 / distance1

  return distance
}

export const getPositionProfit = (
  positionOpenLevel: StoredLevel,
  lastTrend: StoredTrend,
  lastPrice: number
) =>
  lastTrend.direction === TrendDirection.UP
    ? lastPrice - positionOpenLevel.value
    : positionOpenLevel.value - lastPrice

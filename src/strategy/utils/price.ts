import { StoredTrend } from '../../store/trends'
import { TrendDirection } from '../../db/Trend'
import { StoredLevel } from '../../store/levels'

export const getLastPrice = (ask: number, bid: number, trend: StoredTrend) =>
  trend.direction === TrendDirection.UP ? bid : ask

export const getPriceDistanceToPrevLevel = (
  levels: StoredLevel[],
  lastPrice: number,
  isShort: boolean,
  openLevel: StoredLevel,
  closedLevel: StoredLevel
) => {
  const positionLevel = closedLevel || openLevel
  if (!positionLevel || lastPrice === positionLevel.value) return 0

  const sortedLevels = [...levels].sort((a, b) => b.value - a.value)

  const closestLevel1 = sortedLevels.reduce((a: StoredLevel, b: StoredLevel) =>
    isShort
      ? Math.abs(b.value - lastPrice) < Math.abs(a.value - lastPrice)
        ? b
        : a
      : Math.abs(b.value - lastPrice) <= Math.abs(a.value - lastPrice)
      ? b
      : a
  )
  const closestLevel1Idx = sortedLevels.findIndex(
    (level) => level.id === closestLevel1.id
  )

  const closestLevel2 =
    sortedLevels[
      closestLevel1.id === positionLevel.id
        ? isShort
          ? closestLevel1Idx + 1
          : closestLevel1Idx - 1
        : isShort
        ? closestLevel1Idx - 1
        : closestLevel1Idx + 1
    ]

  if (!closestLevel2) return 0

  const min = isShort
    ? Math.max(closestLevel1.value, closestLevel2.value)
    : Math.min(closestLevel1.value, closestLevel2.value)
  const max = isShort
    ? Math.min(closestLevel1.value, closestLevel2.value)
    : Math.max(closestLevel1.value, closestLevel2.value)

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

import { Trend, TrendDirection, Level } from '../../db'
import { isLevelAroundPrice } from './level'

export const getLastPrice = (ask: number, bid: number, trend: Trend) =>
  trend.direction === TrendDirection.UP ? bid : ask

export type PriceRange = [curr: number, prev?: number]

export const getPriceRange = (
  currPrice: number,
  prevPrice?: number
): PriceRange => [currPrice, prevPrice]

export const isPriceInRange = (priceRange: PriceRange, price: number) =>
  !priceRange[1]
    ? priceRange[0] === price
    : Math.max(...priceRange) >= price && Math.min(...priceRange) <= price

export const getPriceDistanceToPrevLevel = (
  levels: Level[],
  lastPrice: number,
  tickValue: number,
  isShort: boolean,
  openLevel?: Level,
  openPositionAvgPrice?: number,
  closedLevel?: Level
) => {
  if (openLevel && openPositionAvgPrice && !closedLevel) {
    if (isLevelAroundPrice([lastPrice], openLevel.value, tickValue)) return 0

    const closestLevel = [...levels]
      .sort((a, b) => b.value - a.value)
      .filter((level) => level.id !== openLevel.id)
      .reduce((a: Level, b: Level) =>
        isShort
          ? Math.abs(b.value - lastPrice) < Math.abs(a.value - lastPrice)
            ? b
            : a
          : Math.abs(b.value - lastPrice) <= Math.abs(a.value - lastPrice)
          ? b
          : a
      )

    const distanceToLevel = Math.abs(closestLevel.value - openPositionAvgPrice)
    const distanceToPrice = Math.abs(lastPrice - openPositionAvgPrice)
    const distance = distanceToPrice / distanceToLevel

    return distance
  }

  const positionLevel = closedLevel || openLevel
  if (
    !positionLevel ||
    isLevelAroundPrice([lastPrice], positionLevel.value, tickValue)
  )
    return 0

  const sortedLevels = [...levels].sort((a, b) => b.value - a.value)

  const closestLevel1 = sortedLevels.reduce((a: Level, b: Level) =>
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
  positionOpenLevel: Level,
  lastTrend: Trend,
  lastPrice: number
) =>
  lastTrend.direction === TrendDirection.UP
    ? lastPrice - positionOpenLevel.value
    : positionOpenLevel.value - lastPrice

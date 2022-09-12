import { compose, propEq, not } from 'ramda'

import { Level, LevelStatus, Trend, TrendDirection } from '../../db'
import { LEVEL_DISTANCE_TICKS } from '../rules'
import { PriceRange } from './price'

export const isLastLevel = (levelId: Level['id'], levels: Level[]) => {
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value)
  const levelIndex = sortedLevels.findIndex(({ id }) => id === levelId)

  return levelIndex === 0 || levelIndex === sortedLevels.length - 1
}

export const isLevelAroundPrice = (
  priceRange: PriceRange,
  levelValue: number,
  tickValue: number
) =>
  (priceRange[0] >= levelValue - LEVEL_DISTANCE_TICKS * tickValue &&
    priceRange[0] <= levelValue + LEVEL_DISTANCE_TICKS * tickValue) ||
  (priceRange[1]
    ? priceRange[1] >= levelValue - LEVEL_DISTANCE_TICKS * tickValue &&
      priceRange[1] <= levelValue + LEVEL_DISTANCE_TICKS * tickValue
    : false)

/**
 * Получить доступный уровень в диапазоне +/-3тика
 * @param levels все возможные уровни
 * @param priceRange текущая и предыдущая цены
 * @param tickValue величина одного тика
 */
export const getNextActiveLevel = (
  levels: Level[],
  priceRange: PriceRange,
  tickValue: number
) =>
  levels.find(
    ({ value, status }) =>
      status === LevelStatus.ACTIVE &&
      isLevelAroundPrice(priceRange, value, tickValue)
  )

export const getTargetValue = (
  levels: Level[],
  openLevel: Level,
  trend: Trend
) => {
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value)
  const openLevelIndex = sortedLevels.findIndex(propEq('id', openLevel.id))

  const targetLevel =
    sortedLevels[
      openLevelIndex + (trend.direction === TrendDirection.UP ? 1 : -1)
    ]

  return targetLevel?.value || 0
}

export const isLevelDisabled = compose(
  not,
  propEq('status', LevelStatus.ACTIVE)
)

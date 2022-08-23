import { compose, propEq, not } from 'ramda'

import { Level, LevelStatus, Trend, TrendDirection } from '../../db'
import { LEVEL_DISTANCE } from '../rules'

export const isLastLevel = (levelId: Level['id'], levels: Level[]) => {
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value)
  const levelIndex = sortedLevels.findIndex(({ id }) => id === levelId)

  return levelIndex === 0 || levelIndex === sortedLevels.length - 1
}

export const isLevelAroundPrice = (price: number, levelValue: number) =>
  price >= levelValue - LEVEL_DISTANCE && price <= levelValue + LEVEL_DISTANCE

/**
 * Получить доступный уровень в диапазоне +/-3тика
 * @param levels все возможные уровни
 * @param lastPrice текущая цена
 */
export const getNextLevel = (levels: Level[], lastPrice: number) =>
  levels.find(({ value }) => isLevelAroundPrice(lastPrice, value))

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

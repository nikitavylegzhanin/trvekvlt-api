import { StoredLevel } from '../../store/levels'
import { LEVEL_DISTANCE } from '../rules'

export const isLastLevel = (
  levelId: StoredLevel['id'],
  levels: StoredLevel[]
) => {
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value)
  const levelIndex = sortedLevels.findIndex(({ id }) => id === levelId)

  return levelIndex === 0 || levelIndex === sortedLevels.length - 1
}

/**
 * Получить доступный уровень в диапазоне +/-3тика
 * @param levels все возможные уровни
 * @param lastPrice текущая цена
 */
export const getNextLevel = (levels: StoredLevel[], lastPrice: number) =>
  levels.find(
    ({ value }) =>
      lastPrice >= value - LEVEL_DISTANCE && lastPrice <= value + LEVEL_DISTANCE
  )

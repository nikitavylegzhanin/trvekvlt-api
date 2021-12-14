import { propEq } from 'ramda'

import { StoredLevel } from '../../store/levels'

export const isLastLevel = (
  levelId: StoredLevel['id'],
  levels: StoredLevel[]
) => {
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value)
  const levelIndex = sortedLevels.findIndex(({ id }) => id === levelId)

  return levelIndex === 0 || levelIndex === sortedLevels.length - 1
}

export const getNextLevel = (levels: StoredLevel[], lastPrice: number) =>
  levels.find(propEq('value', lastPrice))

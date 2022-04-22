import store from '../store'
import { PositionWithLevels, StoredPosition } from '../store/positions'
import { enableLevel, StoredLevel } from '../store/levels'
import { PositionClosingRule, PositionOpeningRule } from '../db/Position'
import { updatePositionClosingRules } from './position'
import { isLastPositionOpen } from './utils'

enum Distance {
  GOOD = 0.7,
  NOT_BAD = 0.5,
  BAD = -0.5,
}

export const LEVEL_DISTANCE = 0.03

const isAbleToCloseBySlt50 = (
  closingRules: PositionWithLevels['closingRules']
) => closingRules.includes(PositionClosingRule.SLT_50PERCENT)

export const isAbleToCloseBySlt3Ticks = (
  closingRules: PositionWithLevels['closingRules']
) => closingRules.includes(PositionClosingRule.SLT_3TICKS)

export const manageClosingRules = (
  distance: number,
  lastPosition: PositionWithLevels
) => {
  const closingRules = [...lastPosition.closingRules]

  if (distance >= Distance.NOT_BAD) {
    // от середины разблочим уровни (на которых открывали/закрывали позицию)
    if (lastPosition.openLevel?.isDisabled) {
      store.dispatch(enableLevel(lastPosition.openLevelId))
    }

    if (lastPosition.closedLevel?.isDisabled) {
      store.dispatch(enableLevel(lastPosition.closedLevelId))
    }

    if (
      isLastPositionOpen(lastPosition.status) &&
      !isAbleToCloseBySlt3Ticks(lastPosition.closingRules)
    ) {
      // разрешим закрываться в 0
      closingRules.push(PositionClosingRule.SLT_3TICKS)
    }
  }

  if (
    distance >= Distance.GOOD &&
    isLastPositionOpen(lastPosition.status) &&
    !isAbleToCloseBySlt50(lastPosition.closingRules)
  ) {
    // рядом со следующим уровнем разрешим закрываться в половину прибыли
    closingRules.push(PositionClosingRule.SLT_50PERCENT)
  }

  // обновляем правила закрытия при изменении
  if (closingRules.length !== lastPosition.closingRules.length) {
    updatePositionClosingRules(lastPosition, closingRules)
  }
}

export const isTp = (
  nextLevel?: StoredLevel,
  lastPositionOpenLevel?: StoredLevel
) =>
  nextLevel &&
  !nextLevel.isDisabled &&
  nextLevel.id !== lastPositionOpenLevel?.id

export const isSlt50Percent = (
  positionClosingRules: StoredPosition['closingRules'],
  distance: number
) =>
  positionClosingRules.includes(PositionClosingRule.SLT_50PERCENT) &&
  distance <= Distance.NOT_BAD

export const isSlt3Ticks = (
  positionClosingRules: StoredPosition['closingRules'],
  positionOpenLevel: StoredLevel,
  lastPrice: number,
  isShort: boolean
) => {
  if (!positionClosingRules.includes(PositionClosingRule.SLT_3TICKS))
    return false

  return isShort
    ? lastPrice >= positionOpenLevel.value - 0.03
    : Math.abs(positionOpenLevel.value - lastPrice) <= 0.03
}

export const isSl = (
  positionClosingRules: StoredPosition['closingRules'],
  positionProfit: number,
  distance: number
) =>
  positionClosingRules.includes(PositionClosingRule.SL) &&
  positionProfit < 0 &&
  distance >= Math.abs(Distance.BAD)

/**
 * Получить правило для открытия/усреднения позиции
 */
export const getNextOpeningRule = (
  price: number,
  levelValue: number,
  operation: 1 | 2
) => {
  const isLong = operation === 1

  if (levelValue === price) {
    return PositionOpeningRule['ON_LEVEL']
  }

  if (price === levelValue - LEVEL_DISTANCE) {
    return isLong
      ? PositionOpeningRule['BEFORE_LEVEL_3TICKS']
      : PositionOpeningRule['AFTER_LEVEL_3TICKS']
  }

  if (price === levelValue + LEVEL_DISTANCE) {
    return isLong
      ? PositionOpeningRule['AFTER_LEVEL_3TICKS']
      : PositionOpeningRule['BEFORE_LEVEL_3TICKS']
  }

  return null
}

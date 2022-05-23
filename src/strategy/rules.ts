import store from '../store'
import { editData } from '../store/bots'
import {
  Bot,
  Position,
  PositionClosingRule,
  PositionOpeningRule,
  Level,
  LevelStatus,
} from '../db'
import { updatePositionClosingRules } from './position'
import { isLastPositionOpen, isLevelDisabled } from './utils'

enum Distance {
  GOOD = 0.7,
  NOT_BAD = 0.5,
  BAD = -0.5,
}

export const LEVEL_DISTANCE = 0.03

const isAbleToCloseBySlt50 = (closingRules: Position['closingRules']) =>
  closingRules.includes(PositionClosingRule.SLT_50PERCENT)

export const isAbleToCloseBySlt3Ticks = (
  closingRules: Position['closingRules']
) => closingRules.includes(PositionClosingRule.SLT_3TICKS)

export const manageClosingRules = async (
  botId: Bot['id'],
  distance: number,
  lastPosition: Position
) => {
  const closingRules = [...lastPosition.closingRules]

  if (distance >= Distance.NOT_BAD) {
    // от середины разблочим уровни (на которых открывали/закрывали позицию)
    if (isLevelDisabled(lastPosition.openLevel)) {
      store.dispatch(
        editData({
          botId,
          level: {
            id: lastPosition.openLevel.id,
            status: LevelStatus.ACTIVE,
          },
          position: {
            id: lastPosition.id,
            openLevel: {
              ...lastPosition.openLevel,
              status: LevelStatus.ACTIVE,
            },
          },
        })
      )
    }

    if (lastPosition.closedLevel && isLevelDisabled(lastPosition.closedLevel)) {
      store.dispatch(
        editData({
          botId,
          level: {
            id: lastPosition.closedLevel.id,
            status: LevelStatus.ACTIVE,
          },
          position: {
            id: lastPosition.id,
            closedLevel: {
              ...lastPosition.closedLevel,
              status: LevelStatus.ACTIVE,
            },
          },
        })
      )
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
    await updatePositionClosingRules(botId, lastPosition, closingRules)
  }
}

export const isTp = (nextLevel?: Level, lastPositionOpenLevel?: Level) =>
  nextLevel &&
  !isLevelDisabled(nextLevel) &&
  nextLevel.id !== lastPositionOpenLevel?.id

export const isSlt50Percent = (
  positionClosingRules: Position['closingRules'],
  distance: number
) =>
  positionClosingRules.includes(PositionClosingRule.SLT_50PERCENT) &&
  distance <= Distance.NOT_BAD

export const isSlt3Ticks = (
  positionClosingRules: Position['closingRules'],
  positionAvgPrice: number,
  lastPrice: number,
  isShort: boolean
) => {
  if (!positionClosingRules.includes(PositionClosingRule.SLT_3TICKS))
    return false

  return isShort
    ? lastPrice >= positionAvgPrice - 0.03
    : Math.abs(positionAvgPrice - lastPrice) <= 0.03
}

export const isSl = (
  positionClosingRules: Position['closingRules'],
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

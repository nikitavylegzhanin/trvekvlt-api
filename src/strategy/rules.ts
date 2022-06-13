import store from '../store'
import { editData } from '../store/bots'
import { Bot, Position, OrderRule, Level, LevelStatus } from '../db'
import { updatePositionAvaiableRules } from './position'
import { isLastPositionOpen, isLevelDisabled } from './utils'

enum Distance {
  GOOD = 0.7,
  NOT_BAD = 0.5,
  BAD = -0.5,
}

export const LEVEL_DISTANCE = 0.03

const isAbleToCloseBySlt50 = (availableRules: Position['availableRules']) =>
  availableRules.includes(OrderRule.CLOSE_BY_SLT_50PERCENT)

export const isAbleToCloseBySlt3Ticks = (
  availableRules: Position['availableRules']
) => availableRules.includes(OrderRule.CLOSE_BY_SLT_3TICKS)

export const manageClosingRules = async (
  botId: Bot['id'],
  distance: number,
  lastPosition: Position
) => {
  const availableRules = [...lastPosition.availableRules]

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
      !isAbleToCloseBySlt3Ticks(lastPosition.availableRules)
    ) {
      // разрешим закрываться в 0
      availableRules.push(OrderRule.CLOSE_BY_SLT_3TICKS)
    }
  }

  if (
    distance >= Distance.GOOD &&
    isLastPositionOpen(lastPosition.status) &&
    !isAbleToCloseBySlt50(lastPosition.availableRules)
  ) {
    // рядом со следующим уровнем разрешим закрываться в половину прибыли
    availableRules.push(OrderRule.CLOSE_BY_SLT_50PERCENT)
  }

  // обновляем правила закрытия при изменении
  if (availableRules.length !== lastPosition.availableRules.length) {
    await updatePositionAvaiableRules(botId, lastPosition, availableRules)
  }
}

export const isTp = (nextLevel?: Level, lastPositionOpenLevel?: Level) =>
  nextLevel &&
  !isLevelDisabled(nextLevel) &&
  nextLevel.id !== lastPositionOpenLevel?.id

export const isSlt50Percent = (
  availableRules: Position['availableRules'],
  distance: number
) =>
  availableRules.includes(OrderRule.CLOSE_BY_SLT_50PERCENT) &&
  distance <= Distance.NOT_BAD

export const isSlt3Ticks = (
  availableRules: Position['availableRules'],
  positionAvgPrice: number,
  lastPrice: number,
  isShort: boolean
) => {
  if (!availableRules.includes(OrderRule.CLOSE_BY_SLT_3TICKS)) return false

  return isShort
    ? lastPrice >= positionAvgPrice - LEVEL_DISTANCE
    : Math.abs(positionAvgPrice - lastPrice) <= LEVEL_DISTANCE
}

export const isSl = (
  availableRules: Position['availableRules'],
  positionProfit: number,
  distance: number
) =>
  availableRules.includes(OrderRule.CLOSE_BY_SL) &&
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
    return OrderRule.OPEN_ON_LEVEL
  }

  if (price === levelValue - LEVEL_DISTANCE) {
    return isLong
      ? OrderRule.OPEN_BEFORE_LEVEL_3TICKS
      : OrderRule.OPEN_AFTER_LEVEL_3TICKS
  }

  if (price === levelValue + LEVEL_DISTANCE) {
    return isLong
      ? OrderRule.OPEN_AFTER_LEVEL_3TICKS
      : OrderRule.OPEN_BEFORE_LEVEL_3TICKS
  }

  return null
}

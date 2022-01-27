import { pathEq } from 'ramda'

import store from '../store'
import { PositionWithLevels, StoredPosition } from '../store/positions'
import { enableLevel, StoredLevel } from '../store/levels'
import { PositionClosingRule } from '../db/Position'
import { updatePositionClosingRules } from './position'
import { isLastPositionOpen } from './utils'

enum Distance {
  GOOD = 0.7,
  NOT_BAD = 0.5,
  BAD = -0.5,
}

const isAbleToCloseBySlt50 = (
  closingRules: PositionWithLevels['closingRules']
) => closingRules.includes(PositionClosingRule.SLT_50PERCENT)

const isAbleToCloseBySlt3Ticks = (
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
      isLastPositionOpen(lastPosition) &&
      !isAbleToCloseBySlt3Ticks(lastPosition.closingRules)
    ) {
      // разрешим закрываться в 0
      closingRules.push(PositionClosingRule.SLT_3TICKS)
    }
  }

  if (
    distance >= Distance.GOOD &&
    isLastPositionOpen(lastPosition) &&
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

export const isTp = pathEq(['isDisabled'], false)

export const isSlt50Percent = (
  positionClosingRules: StoredPosition['closingRules'],
  distance: number
) =>
  positionClosingRules.includes(PositionClosingRule.SLT_50PERCENT) &&
  distance <= Distance.NOT_BAD

export const isSlt3Ticks = (
  positionClosingRules: StoredPosition['closingRules'],
  positionOpenLevel: StoredLevel,
  lastPrice: number
) =>
  positionClosingRules.includes(PositionClosingRule.SLT_3TICKS) &&
  Math.abs(positionOpenLevel.value - lastPrice) <= 3

export const isSl = (
  positionClosingRules: StoredPosition['closingRules'],
  positionProfit: number,
  distance: number
) =>
  positionClosingRules.includes(PositionClosingRule.SL) &&
  positionProfit < 0 &&
  distance >= Math.abs(Distance.BAD)

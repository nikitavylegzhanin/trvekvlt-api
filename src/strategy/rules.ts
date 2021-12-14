import { pathEq } from 'ramda'

import store from '../store'
import {
  addPositionClosingRule,
  PositionWithLevels,
  StoredPosition,
} from '../store/positions'
import { enableLevel, StoredLevel } from '../store/levels'
import { PositionClosingRule } from '../db/Position'

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

export const manageRules = (
  distance: number,
  lastPosition?: PositionWithLevels
) => {
  if (!lastPosition) return

  if (distance >= Distance.NOT_BAD) {
    // от середины разблочим уровни (на которых открывали/закрывали позицию)
    if (lastPosition.openLevel?.isDisabled) {
      store.dispatch(enableLevel(lastPosition.openLevelId))
    }

    if (lastPosition.closedLevel?.isDisabled) {
      store.dispatch(enableLevel(lastPosition.closedLevelId))
    }

    if (!isAbleToCloseBySlt3Ticks(lastPosition.closingRules)) {
      // разрешим закрываться в 0
      store.dispatch(
        addPositionClosingRule({
          positionId: lastPosition.id,
          closingRule: PositionClosingRule.SLT_3TICKS,
        })
      )
    }
  }

  if (
    distance >= Distance.GOOD &&
    !isAbleToCloseBySlt50(lastPosition.closingRules)
  ) {
    // рядом со следующим уровнем разрешим закрываться в половину прибыли
    store.dispatch(
      addPositionClosingRule({
        positionId: lastPosition.id,
        closingRule: PositionClosingRule.SLT_50PERCENT,
      })
    )
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

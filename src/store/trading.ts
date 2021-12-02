import { Middleware, Dispatch, AnyAction } from '@reduxjs/toolkit'

import { Store } from './store'
import {
  PriceActionTypes,
  selectPriceDistanceToPrevLevel,
  selectLastPrice,
} from './price'
import { selectNextLevel, disableLevel, enableLevel } from './levels'
import {
  openPosition,
  closePosition,
  ClosingRule,
  selectLastPositionWithLevels,
  addPositionClosingRule,
  selectPositionProfit,
} from './positions'

const trading: Middleware<Dispatch<AnyAction>> = (store) => (next) => (
  action: AnyAction
) => {
  if (action.type !== PriceActionTypes.CHANGE_PRICE) return next(action)

  const result = next(action)
  const state = store.getState() as Store

  // start trading
  const lastPosition = selectLastPositionWithLevels(state)
  const nextLevel = selectNextLevel(state)
  const distance = selectPriceDistanceToPrevLevel(state)

  if (lastPosition) {
    if (distance >= 0.7) {
      if (!lastPosition.closingRules.includes(ClosingRule.SLT_50PERCENT)) {
        next(
          addPositionClosingRule({
            positionId: lastPosition.id,
            closingRule: ClosingRule.SLT_50PERCENT,
          })
        )
      }
    } else if (distance >= 0.5) {
      if (!lastPosition.closingRules.includes(ClosingRule.SLT_3TICKS)) {
        next(
          addPositionClosingRule({
            positionId: lastPosition.id,
            closingRule: ClosingRule.SLT_3TICKS,
          })
        )
      }

      if (lastPosition.openLevel?.isDisabled) {
        next(enableLevel(lastPosition.openLevelId))
      }

      if (lastPosition.closedLevel?.isDisabled) {
        next(enableLevel(lastPosition.closedLevelId))
      }
    }
  }

  if (!lastPosition || !!lastPosition.isClosed) {
    if (nextLevel && !nextLevel.isDisabled) {
      // open the position
      next(openPosition({ openLevelId: nextLevel.id }))

      // disable the open level
      next(disableLevel(nextLevel.id))
    }
  } else {
    const lastPrice = selectLastPrice(state)
    const positionProfit = selectPositionProfit(state)

    // close the position by TP
    if (nextLevel && !nextLevel.isDisabled) {
      next(
        closePosition({
          positionId: lastPosition.id,
          closedLevelId: nextLevel.id,
          closedByRule: ClosingRule.TP,
        })
      )

      // disable the closed level
      next(disableLevel(nextLevel.id))
    } else if (
      lastPosition.closingRules.includes(ClosingRule.SLT_50PERCENT) &&
      distance <= 0.5
    ) {
      // close by SLT_50PERCENT
      next(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.SLT_50PERCENT,
        })
      )

      next(disableLevel(lastPosition.openLevelId))
    } else if (
      lastPosition.closingRules.includes(ClosingRule.SLT_3TICKS) &&
      Math.abs(lastPosition.openLevel.value - lastPrice) <= 3
    ) {
      // close by SLT_3TICKS
      next(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.SLT_3TICKS,
        })
      )

      next(disableLevel(lastPosition.openLevelId))
    } else if (
      lastPosition.closingRules.includes(ClosingRule.SL) &&
      positionProfit < 0 &&
      distance >= 0.5
    ) {
      // close by SL
      next(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.SL,
        })
      )
    }
  }

  return result
}

export default trading

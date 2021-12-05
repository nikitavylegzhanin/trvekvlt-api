import { Middleware, Dispatch, AnyAction } from '@reduxjs/toolkit'

import { Store } from '../store'
import {
  PriceActionTypes,
  selectPriceDistanceToPrevLevel,
  selectLastPrice,
} from './'
import { selectNextLevel, disableLevel, enableLevel } from '../levels'
import {
  openPosition,
  closePosition,
  ClosingRule,
  selectLastPositionWithLevels,
  addPositionClosingRule,
  selectPositionProfit,
} from '../positions'
import { selectConfig, editConfig } from '../config'
import { isTradingInterval } from './utils'

const middleware: Middleware<Dispatch<AnyAction>> = (store) => (dispatch) => (
  action: AnyAction
) => {
  const result = dispatch(action)
  if (action.type !== PriceActionTypes.CHANGE_PRICE) {
    return result
  }

  // Process trading logic when price changes
  const state = store.getState() as Store
  const config = selectConfig(state)
  const lastPosition = selectLastPositionWithLevels(state)
  const date = new Date()

  if (!isTradingInterval(date)) {
    if (lastPosition && !lastPosition.isClosed) {
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.MARKET_PHASE_END,
        })
      )
    }

    if (config.isDisabled) {
      dispatch(editConfig({ isDisabled: false }))
    }

    return result
  }

  const nextLevel = selectNextLevel(state)
  const distance = selectPriceDistanceToPrevLevel(state)

  if (lastPosition) {
    if (distance >= 0.7) {
      if (!lastPosition.closingRules.includes(ClosingRule.SLT_50PERCENT)) {
        dispatch(
          addPositionClosingRule({
            positionId: lastPosition.id,
            closingRule: ClosingRule.SLT_50PERCENT,
          })
        )
      }
    } else if (distance >= 0.5) {
      if (!lastPosition.closingRules.includes(ClosingRule.SLT_3TICKS)) {
        dispatch(
          addPositionClosingRule({
            positionId: lastPosition.id,
            closingRule: ClosingRule.SLT_3TICKS,
          })
        )
      }

      if (lastPosition.openLevel?.isDisabled) {
        dispatch(enableLevel(lastPosition.openLevelId))
      }

      if (lastPosition.closedLevel?.isDisabled) {
        dispatch(enableLevel(lastPosition.closedLevelId))
      }
    }
  }

  if (!lastPosition || !!lastPosition.isClosed) {
    if (nextLevel && !nextLevel.isDisabled) {
      // open the position
      dispatch(openPosition({ openLevelId: nextLevel.id }))

      // disable the open level
      dispatch(disableLevel(nextLevel.id))
    }
  } else {
    const lastPrice = selectLastPrice(state)
    const positionProfit = selectPositionProfit(state)

    // close the position by TP
    if (nextLevel && !nextLevel.isDisabled) {
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedLevelId: nextLevel.id,
          closedByRule: ClosingRule.TP,
        })
      )

      // disable the closed level
      dispatch(disableLevel(nextLevel.id))
    } else if (
      lastPosition.closingRules.includes(ClosingRule.SLT_50PERCENT) &&
      distance <= 0.5
    ) {
      // close by SLT_50PERCENT
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.SLT_50PERCENT,
        })
      )

      dispatch(disableLevel(lastPosition.openLevelId))
    } else if (
      lastPosition.closingRules.includes(ClosingRule.SLT_3TICKS) &&
      Math.abs(lastPosition.openLevel.value - lastPrice) <= 3
    ) {
      // close by SLT_3TICKS
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.SLT_3TICKS,
        })
      )

      dispatch(disableLevel(lastPosition.openLevelId))
    } else if (
      lastPosition.closingRules.includes(ClosingRule.SL) &&
      positionProfit < 0 &&
      distance >= 0.5
    ) {
      // close by SL
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: ClosingRule.SL,
        })
      )
    }
  }

  return result
}

export default middleware

import { Middleware, Dispatch, AnyAction } from '@reduxjs/toolkit'

import { Store } from '../store'
import {
  PriceActionTypes,
  selectPriceDistanceToPrevLevel,
  selectLastPrice,
} from './'
import {
  selectNextLevel,
  disableLevel,
  enableLevel,
  selectLevels,
} from '../levels'
import {
  openPosition,
  closePosition,
  selectLastPositionWithLevels,
  addPositionClosingRule,
  selectPositionProfit,
} from '../positions'
import { PositionClosingRule } from '../../db/Position'
import { selectConfig, editConfig } from '../config'
import { isTradingInterval, isLastLevel } from './utils'

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
    if (lastPosition && !lastPosition.closedByRule) {
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: PositionClosingRule.MARKET_PHASE_END,
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
      if (
        !lastPosition.closingRules.includes(PositionClosingRule.SLT_50PERCENT)
      ) {
        dispatch(
          addPositionClosingRule({
            positionId: lastPosition.id,
            closingRule: PositionClosingRule.SLT_50PERCENT,
          })
        )
      }
    } else if (distance >= 0.5) {
      if (!lastPosition.closingRules.includes(PositionClosingRule.SLT_3TICKS)) {
        dispatch(
          addPositionClosingRule({
            positionId: lastPosition.id,
            closingRule: PositionClosingRule.SLT_3TICKS,
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

  if (!lastPosition || lastPosition.closedByRule !== undefined) {
    const levels = selectLevels(state)

    if (
      nextLevel &&
      !nextLevel.isDisabled &&
      !isLastLevel(nextLevel.id, levels)
    ) {
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
          closedByRule: PositionClosingRule.TP,
        })
      )

      // disable the closed level
      dispatch(disableLevel(nextLevel.id))
    } else if (
      lastPosition.closingRules.includes(PositionClosingRule.SLT_50PERCENT) &&
      distance <= 0.5
    ) {
      // close by SLT_50PERCENT
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: PositionClosingRule.SLT_50PERCENT,
        })
      )

      dispatch(disableLevel(lastPosition.openLevelId))
    } else if (
      lastPosition.closingRules.includes(PositionClosingRule.SLT_3TICKS) &&
      Math.abs(lastPosition.openLevel.value - lastPrice) <= 3
    ) {
      // close by SLT_3TICKS
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: PositionClosingRule.SLT_3TICKS,
        })
      )

      dispatch(disableLevel(lastPosition.openLevelId))
    } else if (
      lastPosition.closingRules.includes(PositionClosingRule.SL) &&
      positionProfit < 0 &&
      distance >= 0.5
    ) {
      // close by SL
      dispatch(
        closePosition({
          positionId: lastPosition.id,
          closedByRule: PositionClosingRule.SL,
        })
      )
    }
  }

  return result
}

export default middleware

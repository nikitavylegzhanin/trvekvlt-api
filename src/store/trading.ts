import { Middleware, Dispatch, AnyAction } from '@reduxjs/toolkit'

import { Store } from './store'
import {
  PriceActionTypes,
  getPrice,
  getPriceDistanceToPrevLevel,
} from './price'
import { getNextLevel, disableLevel, enableLevel } from './levels'
import {
  openPosition,
  closePosition,
  ClosePositionReason,
  getLastPositionWithLevels,
} from './positions'

const trading: Middleware<Dispatch<AnyAction>> = (store) => (next) => (
  action: AnyAction
) => {
  if (action.type !== PriceActionTypes.CHANGE_PRICE) return next(action)

  const prevState = store.getState() as Store
  const result = next(action)
  const state = store.getState() as Store
  const priceA = getPrice(prevState)
  const priceB = getPrice(state)

  if (priceA.ask === priceB.ask && priceA.bid === priceB.bid)
    return next(action)

  // start trading
  const lastPosition = getLastPositionWithLevels(state)
  const nextLevel = getNextLevel(state)
  const distance = getPriceDistanceToPrevLevel(state)

  if (lastPosition && distance >= 0.5) {
    if (lastPosition.openLevel?.isDisabled) {
      next(enableLevel(lastPosition.openLevelId))
    }

    if (lastPosition.closedLevel?.isDisabled) {
      next(enableLevel(lastPosition.closedLevelId))
    }
  }

  if (nextLevel && (!lastPosition || !!lastPosition.closedLevelId)) {
    if (!nextLevel.isDisabled) {
      // open the position
      next(
        openPosition({
          id: Math.random().toString(36),
          openLevelId: nextLevel.id,
        })
      )

      // disable the open level
      next(disableLevel(nextLevel.id))
    }
  } else if (nextLevel && lastPosition && !lastPosition.closedLevelId) {
    // close the position by TP
    next(
      closePosition({
        positionId: lastPosition.id,
        reason: ClosePositionReason.TP,
        closedLevelId: nextLevel.id,
      })
    )

    // disable the closed level
    next(disableLevel(nextLevel.id))
  }

  return result
}

export default trading

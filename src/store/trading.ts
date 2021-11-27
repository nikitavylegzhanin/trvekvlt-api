import { Middleware, Dispatch, AnyAction } from '@reduxjs/toolkit'

import { Store } from './store'
import { PriceActionTypes, getPrice } from './price'
import { getNextLevel } from './levels'
import { getLastPosition, openPosition } from './positions'

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
  const lastPosition = getLastPosition(state)
  const nextLevel = getNextLevel(state)

  if (nextLevel && !lastPosition?.isClosed) {
    next(
      openPosition({
        id: '1',
        levelId: nextLevel.id,
      })
    )
  }

  return result
}

export default trading

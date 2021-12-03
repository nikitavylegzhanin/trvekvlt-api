import { Middleware, Dispatch, PayloadAction } from '@reduxjs/toolkit'
import { pipe, filter, propEq, findLast, T, ifElse, always } from 'ramda'

import { Store } from '../store'
import {
  PositionsActionType,
  ClosePositionPayload,
  Position,
  ClosingRule,
} from './'
import { selectPositions } from './selectors'
import { addTrend, selectLastTrend, TrendDirection } from '../trends'

const getLastClosedPosition = pipe(
  selectPositions,
  filter<Position>(propEq('isClosed', true)),
  findLast<Position>(T)
)

const getCorrectionTrendDirection = pipe(
  selectLastTrend,
  ifElse(
    propEq('direction', TrendDirection.UP),
    always(TrendDirection.DOWN),
    always(TrendDirection.UP)
  )
)

const middleware: Middleware<Dispatch<PayloadAction>> = (store) => (
  dispatch
) => (action: PayloadAction<ClosePositionPayload>) => {
  if (action.type !== PositionsActionType.CLOSE_POSITION)
    return dispatch(action)

  const state = store.getState() as Store

  if (action.payload.closedByRule === ClosingRule.SL) {
    const lastClosedPosition = getLastClosedPosition(state)

    if (lastClosedPosition?.closedByRule === ClosingRule.SL) {
      // 2 SL consecutive → correction
      const correctionTrendDirection = getCorrectionTrendDirection(state)

      dispatch(
        addTrend({ direction: correctionTrendDirection, isCorrection: true })
      )
    }
  }

  return dispatch(action)
}

export default middleware

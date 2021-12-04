import { Middleware, Dispatch, PayloadAction } from '@reduxjs/toolkit'
import {
  pipe,
  filter,
  propEq,
  findLast,
  T,
  ifElse,
  always,
  includes,
  not,
  __,
} from 'ramda'

import { Store } from '../store'
import { Position, ClosingRule } from './'
import { PositionsActionType, ClosePositionPayload } from './actions'
import { selectPositions } from './selectors'
import { selectConfig, editConfig } from '../config'
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

const isNotMiddlewareAction = pipe(
  includes(__, [
    PositionsActionType.OPEN_POSITION,
    PositionsActionType.CLOSE_POSITION,
  ]),
  not
)

const middleware: Middleware<Dispatch<PayloadAction>> = (store) => (
  dispatch
) => (action: PayloadAction<ClosePositionPayload, PositionsActionType>) => {
  if (isNotMiddlewareAction(action.type)) {
    return dispatch(action)
  }

  const state = store.getState() as Store

  if (action.type === PositionsActionType.OPEN_POSITION) {
    const { isDisabled } = selectConfig(state)

    if (isDisabled) {
      return dispatch
    }
  }

  if (action.type === PositionsActionType.CLOSE_POSITION) {
    if (action.payload.closedByRule === ClosingRule.SL) {
      const lastClosedPosition = getLastClosedPosition(state)
      const lastTrend = selectLastTrend(state)

      if (lastTrend.isCorrection) {
        // SL on correction → disable engine
        dispatch(editConfig({ isDisabled: true }))
      }

      if (lastClosedPosition?.closedByRule === ClosingRule.SL) {
        // 2 SL consecutive → correction
        const correctionTrendDirection = getCorrectionTrendDirection(state)

        dispatch(
          addTrend({ direction: correctionTrendDirection, isCorrection: true })
        )
      }
    }
  }

  return dispatch(action)
}

export default middleware

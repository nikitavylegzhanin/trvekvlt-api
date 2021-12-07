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
import { StoredPosition } from './'
import {
  PositionsActionType,
  ClosePositionPayload,
  resetPositions,
} from './actions'
import { selectPositions } from './selectors'
import { selectConfig, editConfig } from '../config'
import { addTrend, selectLastTrend } from '../trends'
import { TrendDirection, TrendType } from '../../db/Trend'
import { PositionClosingRule } from '../../db/Position'

const getLastClosedPosition = pipe(
  selectPositions,
  filter<StoredPosition>((position) => position.closedByRule !== undefined),
  findLast<StoredPosition>(T)
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
    if (action.payload.closedByRule === PositionClosingRule.MARKET_PHASE_END) {
      dispatch(resetPositions())
    }

    if (action.payload.closedByRule === PositionClosingRule.SL) {
      const lastClosedPosition = getLastClosedPosition(state)
      const lastTrend = selectLastTrend(state)

      if (lastTrend.type === TrendType.CORRECTION) {
        // SL on correction → disable engine
        dispatch(editConfig({ isDisabled: true }))
      }

      if (lastClosedPosition?.closedByRule === PositionClosingRule.SL) {
        // 2 SL consecutive → correction
        const correctionTrendDirection = getCorrectionTrendDirection(state)

        dispatch(
          addTrend({
            direction: correctionTrendDirection,
            type: TrendType.CORRECTION,
          })
        )
      }
    }
  }

  return dispatch(action)
}

export default middleware

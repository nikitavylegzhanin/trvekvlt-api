import { createAction } from '@reduxjs/toolkit'

import { Trend } from './reducer'

export enum TrendsActionType {
  ADD_TREND = 'Trends/ADD_TREND',
}

type AddTrendPayload = {
  direction: Trend['direction']
  isCorrection?: Trend['isCorrection']
}

export const addTrend = createAction<
  AddTrendPayload,
  TrendsActionType.ADD_TREND
>(TrendsActionType.ADD_TREND)

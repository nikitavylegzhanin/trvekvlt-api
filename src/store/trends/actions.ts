import { createAction } from '@reduxjs/toolkit'

import { StoredTrend } from './reducer'

export enum TrendsActionType {
  ADD_TREND = 'Trends/ADD_TREND',
}

type AddTrendPayload = {
  direction: StoredTrend['direction']
  type: StoredTrend['type']
}

export const addTrend = createAction<
  AddTrendPayload,
  TrendsActionType.ADD_TREND
>(TrendsActionType.ADD_TREND)

import { createAction } from '@reduxjs/toolkit'

import { StoredTrend } from './reducer'

export enum TrendsActionType {
  INIT_TRENDS = 'Trends/INIT_TRENDS',
  ADD_TREND = 'Trends/ADD_TREND',
  UPDATE_TREND = 'Trends/UPDATE_TREND',
}

export const initTrends = createAction<
  StoredTrend[],
  TrendsActionType.INIT_TRENDS
>(TrendsActionType.INIT_TRENDS)

type AddTrendPayload = {
  direction: StoredTrend['direction']
  type: StoredTrend['type']
}

export const addTrend = createAction<
  AddTrendPayload,
  TrendsActionType.ADD_TREND
>(TrendsActionType.ADD_TREND)

type UpdateTrendPayload = {
  trendId: StoredTrend['id']
  data: Partial<StoredTrend>
}

export const updateTrend = createAction<
  UpdateTrendPayload,
  TrendsActionType.UPDATE_TREND
>(TrendsActionType.UPDATE_TREND)

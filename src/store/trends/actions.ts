import { createAction } from '@reduxjs/toolkit'

import { Trend } from './reducer'

export enum TrendsActionTypes {
  ADD_TREND = 'Trends/ADD_TREND',
}

export const addTrend = createAction<Trend, TrendsActionTypes.ADD_TREND>(
  TrendsActionTypes.ADD_TREND
)

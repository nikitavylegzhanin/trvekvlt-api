import { propEq, ifElse, always } from 'ramda'

import { TrendDirection, TrendType } from '../../db/Trend'
import { StoredTrend } from '../../store/trends'

export const isCorrectionTrend = propEq('type', TrendType.CORRECTION)

export const isDowntrend = propEq('direction', TrendDirection.DOWN)

export const getCorrectionTrendDirection = ifElse<
  StoredTrend[],
  TrendDirection,
  TrendDirection
>(
  propEq('direction', TrendDirection.UP),
  always(TrendDirection.DOWN),
  always(TrendDirection.UP)
)

export const getOpenOperation = ifElse<StoredTrend[], 1 | 2, 1 | 2>(
  propEq('direction', TrendDirection.UP),
  always(1),
  always(2)
)

export const getCloseOperation = ifElse<StoredTrend[], 1 | 2, 1 | 2>(
  propEq('direction', TrendDirection.UP),
  always(2),
  always(1)
)

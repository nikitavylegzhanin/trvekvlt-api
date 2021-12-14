import { propEq, ifElse, always } from 'ramda'

import { TrendDirection, TrendType } from '../../db/Trend'
import { StoredTrend } from '../../store/trends'

export const isCorrectionTrend = propEq('type', TrendType.CORRECTION)

export const getCorrectionTrendDirection = ifElse<
  StoredTrend[],
  TrendDirection,
  TrendDirection
>(
  propEq('direction', TrendDirection.UP),
  always(TrendDirection.DOWN),
  always(TrendDirection.UP)
)

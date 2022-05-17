import { propEq, ifElse, always, pipe, path, findLast, T } from 'ramda'

import { Trend, TrendDirection, TrendType } from '../../db'

export const getLastTrend = pipe(path(['trends']), findLast<Trend>(T))

export const isCorrectionTrend = propEq('type', TrendType.CORRECTION)

export const isDowntrend = propEq('direction', TrendDirection.DOWN)

export const getCorrectionTrendDirection = ifElse<
  Trend[],
  TrendDirection,
  TrendDirection
>(
  propEq('direction', TrendDirection.UP),
  always(TrendDirection.DOWN),
  always(TrendDirection.UP)
)

export const getOpenOperation = ifElse<Trend[], 1 | 2, 1 | 2>(
  propEq('direction', TrendDirection.UP),
  always(1),
  always(2)
)

export const getCloseOperation = ifElse<Trend[], 1 | 2, 1 | 2>(
  propEq('direction', TrendDirection.UP),
  always(2),
  always(1)
)

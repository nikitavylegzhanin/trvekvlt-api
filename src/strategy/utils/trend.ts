import { OperationType } from '@tinkoff/invest-openapi-js-sdk'

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

export const getOpenOperation = ifElse<
  StoredTrend[],
  OperationType,
  OperationType
>(propEq('direction', TrendDirection.UP), always('Buy'), always('Sell'))

export const getCloseOperation = ifElse<
  StoredTrend[],
  OperationType,
  OperationType
>(propEq('direction', TrendDirection.UP), always('Sell'), always('Buy'))

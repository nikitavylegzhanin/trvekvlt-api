import { pathEq, pipe, filter, propEq, findLast, T, path } from 'ramda'

import { Position, PositionStatus, OrderRule } from '../../db'

export const getLastPosition = pipe(path(['positions']), findLast<Position>(T))

export const isLastPositionClosed = (lastPosition?: Position) =>
  !lastPosition || lastPosition.status === PositionStatus.CLOSED

export const isLastPositionOpen = (positionStatus: PositionStatus) =>
  positionStatus === PositionStatus.OPEN_PARTIAL ||
  positionStatus === PositionStatus.OPEN_FULL

export const isLastPositionOpenPartially = pathEq(
  ['status'],
  PositionStatus.OPEN_PARTIAL
)

export const getLastClosedPosition = pipe(
  filter<Position>(propEq('status', PositionStatus.CLOSED)),
  findLast<Position>(T)
)

const OPEN_RULES = [
  OrderRule.OPEN_BEFORE_LEVEL_3TICKS,
  OrderRule.OPEN_ON_LEVEL,
  OrderRule.OPEN_AFTER_LEVEL_3TICKS,
]

export const getPositionNextStatus = (
  availableRules: Position['availableRules']
) =>
  OPEN_RULES.some((openRule) => availableRules.includes(openRule))
    ? PositionStatus.OPEN_PARTIAL
    : PositionStatus.OPEN_FULL

/**
 * Доступность правила для открытия/усреднения позиции
 */
export const isOpeningRuleAvailable = (
  openingRule: OrderRule,
  lastPosition?: Position
) => {
  if (!openingRule) return false

  if (
    isLastPositionClosed(lastPosition) ||
    lastPosition.availableRules.includes(openingRule)
  )
    return true

  return false
}

/**
 * Объем позиции (количество бумаг)
 */
export const getPositionValue = (position: Position) =>
  position.orders.reduce((value, order) => value + order.quantity, 0)

/**
 * Средняя цена позиции
 */
export const getPositionAvgPrice = (position: Position) => {
  const sum = position.orders.reduce((sum, order) => sum + order.price, 0)

  return sum / position.orders.length
}

export const isClosedBySL = (position: Position) =>
  position.orders.findIndex(propEq('rule', OrderRule.CLOSE_BY_SL)) !== -1

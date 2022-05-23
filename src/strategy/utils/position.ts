import { pathEq, pipe, filter, propEq, findLast, T, path } from 'ramda'

import { Position, PositionStatus, PositionOpeningRule } from '../../db'

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

export const getPositionNextStatus = (
  openedByRules: Position['openedByRules']
) =>
  openedByRules.length >= Object.keys(PositionOpeningRule).length
    ? PositionStatus.OPEN_FULL
    : PositionStatus.OPEN_PARTIAL

/**
 * Доступность правила для открытия/усреднения позиции
 */
export const isOpeningRuleAvailable = (
  openingRule: PositionOpeningRule,
  lastPosition?: Position
) => {
  if (!openingRule) return false

  if (isLastPositionClosed(lastPosition)) return true

  if (lastPosition.openedByRules.includes(openingRule)) return false

  return true
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

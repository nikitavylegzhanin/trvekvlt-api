import { pathEq, pipe, filter, propEq, findLast, T } from 'ramda'

import { PositionStatus, PositionOpeningRule } from '../../db/Position'
import { StoredPosition } from '../../store/positions'

export const isLastPositionClosed = (lastPosition?: StoredPosition) =>
  !lastPosition || lastPosition.status === PositionStatus.CLOSED

export const isLastPositionOpen = (positionStatus: PositionStatus) =>
  positionStatus === PositionStatus.OPEN_PARTIAL ||
  positionStatus === PositionStatus.OPEN_FULL

export const isLastPositionOpenPartially = pathEq(
  ['status'],
  PositionStatus.OPEN_PARTIAL
)

export const getLastClosedPosition = pipe(
  filter<StoredPosition>(propEq('status', PositionStatus.CLOSED)),
  findLast<StoredPosition>(T)
)

export const getPositionNextStatus = (
  openedByRules: StoredPosition['openedByRules']
) =>
  openedByRules.length >= Object.keys(PositionOpeningRule).length
    ? PositionStatus.OPEN_FULL
    : PositionStatus.OPEN_PARTIAL

/**
 * Доступность правила для открытия/усреднения позиции
 */
export const isOpeningRuleAvailable = (
  openingRule: PositionOpeningRule,
  lastPosition?: StoredPosition
) => {
  if (!openingRule) return false

  if (isLastPositionClosed(lastPosition)) return true

  if (lastPosition.openedByRules.includes(openingRule)) return false

  return true
}

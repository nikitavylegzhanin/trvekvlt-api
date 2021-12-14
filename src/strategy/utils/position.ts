import { pathEq, pipe, filter, propEq, findLast, T } from 'ramda'

import { PositionStatus } from '../../db/Position'
import { StoredPosition } from '../../store/positions'

export const isLastPositionClosed = (lastPosition?: StoredPosition) =>
  !lastPosition || lastPosition.status === PositionStatus.CLOSED

export const isLastPositionOpen = pathEq(['status'], PositionStatus.OPEN)

export const getLastClosedPosition = pipe(
  filter<StoredPosition>(propEq('status', PositionStatus.CLOSED)),
  findLast<StoredPosition>(T)
)

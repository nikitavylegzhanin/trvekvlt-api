import store from '../store'
import { StoredPosition, updatePosition } from '../store/positions'
import { disableLevel, StoredLevel } from '../store/levels'
import { PositionStatus } from '../db/Position'

const closePosition = async (
  positionId: StoredPosition['id'],
  closedByRule: StoredPosition['closedByRule'],
  disableLevelId?: StoredLevel['id'],
  closedLevelId?: StoredPosition['closedLevelId']
) => {
  // блочим уровень
  if (disableLevelId) store.dispatch(disableLevel(disableLevelId))

  // изменяем позицию в стейте
  store.dispatch(
    updatePosition({
      positionId,
      data: {
        status: PositionStatus.CLOSED,
        closedLevelId: closedLevelId,
        closedByRule: closedByRule,
      },
    })
  )

  // отправляем заявку
  // сохраняем в бд
  // обновляем стейт
}

export default closePosition

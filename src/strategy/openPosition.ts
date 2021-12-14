import { getConnection } from 'typeorm'
import { pick } from 'ramda'

import store from '../store'
import {
  StoredPosition,
  addPosition,
  updatePosition,
  removePosition,
} from '../store/positions'
import { disableLevel, removeLevel } from '../store/levels'
import { Level, Position, PositionStatus } from '../db'

const openPosition = async (openLevelId: StoredPosition['id']) => {
  // блочим уровень
  store.dispatch(disableLevel(openLevelId))

  // добавляем позицию в стейт
  store.dispatch(addPosition({ openLevelId }))

  // отправляем заявку

  // сохраняем в бд
  try {
    if (process.env.NODE_ENV === 'test') {
      store.dispatch(
        updatePosition({
          positionId: 0,
          data: {
            id: Math.floor(Math.random() * 666),
            status: PositionStatus.OPEN,
          },
        })
      )

      return
    }

    const { manager } = getConnection()

    const openLevel = await manager.findOneOrFail(Level, openLevelId) // роняем при расхождении в уровнях
    const position = await manager.save(manager.create(Position, { openLevel }))

    // обновляем данные позиции
    store.dispatch(
      updatePosition({
        positionId: 0,
        data: {
          ...pick(['id', 'closingRules', 'closedByRule', 'status'], position),
          openLevelId: position.openLevel.id,
        },
      })
    )
  } catch (error) {
    // удаляем позицию и уровень
    store.dispatch(removePosition(0))
    store.dispatch(removeLevel(openLevelId))
  }
}

export default openPosition

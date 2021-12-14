import { PlacedMarketOrder } from '@tinkoff/invest-openapi-js-sdk'
import { getConnection } from 'typeorm'
import { pick } from 'ramda'

import store from '../store'
import {
  StoredPosition,
  addPosition,
  updatePosition,
  removePosition,
} from '../store/positions'
import { disableLevel, removeLevel, StoredLevel } from '../store/levels'
import { Level, Position, PositionStatus } from '../db'

export const openPosition = async (
  placeOrder: () => Promise<PlacedMarketOrder>,
  openLevelId: StoredPosition['id']
) => {
  // блочим уровень
  store.dispatch(disableLevel(openLevelId))

  // добавляем позицию в стейт
  store.dispatch(addPosition({ openLevelId }))

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

    // отправляем заявку
    const order = await placeOrder()

    if (order.rejectReason) {
      throw new Error(order.rejectReason)
    }

    // сохраняем в бд
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

export const closePosition = async (
  placeOrder: () => Promise<PlacedMarketOrder>,
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
        status: PositionStatus.CLOSING,
        closedLevelId: closedLevelId,
        closedByRule: closedByRule,
      },
    })
  )

  if (process.env.NODE_ENV !== 'test') {
    // отправляем заявку
    const order = await placeOrder()

    if (order.rejectReason) {
      throw new Error(order.rejectReason)
    }

    // сохраняем в бд
    const { manager } = getConnection()
    await manager.update(Position, positionId, {
      status: PositionStatus.CLOSED,
    })
  }

  // обновляем стейт
  store.dispatch(
    updatePosition({
      positionId,
      data: { status: PositionStatus.CLOSED },
    })
  )
}
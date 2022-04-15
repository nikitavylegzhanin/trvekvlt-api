import { Operation } from '@tinkoff/invest-openapi-js-sdk'
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
import { getPositionNextStatus } from './utils'
import {
  Level,
  Position,
  PositionStatus,
  PositionOpeningRule,
  PositionClosingRule,
  Log,
  LogType,
} from '../db'
import { sendMessage } from '../telegram'

/**
 * Открытие новой позиции
 */
export const openPosition = async (
  placeOrder: () => Promise<Operation>,
  openLevelId: StoredLevel['id'],
  openingRule: PositionOpeningRule
) => {
  // добавляем позицию в стейт
  store.dispatch(addPosition({ openLevelId }))

  try {
    if (process.env.NODE_ENV === 'test') {
      store.dispatch(
        updatePosition({
          positionId: 0,
          data: {
            id: Math.floor(Math.random() * 666),
            status: PositionStatus.OPEN_PARTIAL,
            openedByRules: [openingRule],
          },
        })
      )

      return
    }

    // отправляем заявку
    const operation = await placeOrder()

    // сохраняем в бд
    const { manager } = getConnection()
    const openLevel = await manager.findOneOrFail(Level, openLevelId) // роняем при расхождении в уровнях
    const position = await manager.save(
      manager.create(Position, { openLevel, operations: [operation] })
    )

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

    if (process.env.NODE_ENV !== 'test') {
      const type = LogType.ERROR
      const message = JSON.stringify(error)

      sendMessage(type, message)

      const { manager } = getConnection()
      manager.save(
        manager.create(Log, {
          type,
          message,
        })
      )
    }
  }
}

/**
 * Усреденение позиции
 */
export const averagingPosition = async (
  placeOrder: () => Promise<Operation>,
  storedPosition: StoredPosition,
  openingRule: PositionOpeningRule
) => {
  const openedByRules = [...storedPosition.openedByRules, openingRule]
  const status = getPositionNextStatus(openedByRules)

  // блочим уровень, если позиция открыта полностью
  if (status === PositionStatus.OPEN_FULL) {
    store.dispatch(disableLevel(storedPosition.openLevelId))
  }

  // обновляем позицию в стейте
  store.dispatch(
    updatePosition({
      positionId: storedPosition.id,
      data: {
        status,
        openedByRules,
      },
    })
  )

  if (process.env.NODE_ENV === 'test') return

  const { manager } = getConnection()

  try {
    // отправляем заявку
    const operation = await placeOrder()

    // обновляем позицию в бд
    const position = await manager.findOneOrFail(Position, storedPosition.id)
    position.operations.push(operation)
    position.status = status
    position.openedByRules = openedByRules

    await manager.save(position)
  } catch (error) {
    // откратываем позицию в стейте
    store.dispatch(
      updatePosition({
        positionId: storedPosition.id,
        data: {
          status: storedPosition.status,
          openedByRules: storedPosition.openedByRules,
        },
      })
    )

    const type = LogType.ERROR
    const message = JSON.stringify(error)

    sendMessage(type, message)

    manager.save(
      manager.create(Log, {
        type,
        message,
      })
    )
  }
}

export const closePosition = async (
  placeOrder: () => Promise<Operation>,
  positionId: StoredPosition['id'],
  closedByRule: StoredPosition['closedByRule'],
  disableLevelId?: StoredLevel['id'],
  closedLevelId?: StoredPosition['closedLevelId']
) => {
  // блочим уровень
  if (disableLevelId) {
    store.dispatch(disableLevel(disableLevelId))
  }

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
    const { manager } = getConnection()

    try {
      // отправляем заявку
      const operation = await placeOrder()

      // обновляем позицию в бд
      const position = await manager.findOneOrFail(Position, positionId)
      position.operations.push(operation)
      position.status = PositionStatus.CLOSED
      position.closedByRule = closedByRule

      if (closedLevelId) {
        const closedLevel = await manager.findOneOrFail(Level, closedLevelId)

        position.closedLevel = closedLevel
      }

      await manager.save(position)
    } catch (error) {
      const type = LogType.ERROR
      const message = JSON.stringify(error)

      sendMessage(type, message)

      manager.save(
        manager.create(Log, {
          type,
          message,
        })
      )
    }
  }

  // обновляем стейт
  store.dispatch(
    updatePosition({
      positionId,
      data: { status: PositionStatus.CLOSED },
    })
  )
}

export const updatePositionClosingRules = async (
  position: StoredPosition,
  closingRules: PositionClosingRule[]
) => {
  store.dispatch(
    updatePosition({
      positionId: position.id,
      data: { closingRules },
    })
  )

  if (process.env.NODE_ENV === 'test') return

  try {
    const { manager } = getConnection()
    await manager.update(Position, position.id, { closingRules })
  } catch (error) {
    store.dispatch(
      updatePosition({
        positionId: position.id,
        data: {
          closingRules: position.closingRules,
        },
      })
    )
  }
}

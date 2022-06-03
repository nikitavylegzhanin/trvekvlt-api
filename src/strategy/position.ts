import { Order } from '../api'
import store from '../store'
import { StoredBot, addData, editData } from '../store/bots'
import { getPositionNextStatus } from './utils'
import db, {
  Level,
  Position,
  PositionStatus,
  PositionOpeningRule,
  PositionClosingRule,
  LevelStatus,
  Log,
  LogType,
  DEFAULT_CLOSING_RULES,
} from '../db'
import { sendMessage } from '../telegram'

/**
 * Открытие новой позиции
 */
export const openPosition = async (
  placeOrder: () => Promise<Order>,
  botId: StoredBot['id'],
  openLevel: Level,
  openingRule: PositionOpeningRule
) => {
  try {
    // отправляем заявку
    const order = await placeOrder()

    if (process.env.NODE_ENV === 'test') {
      store.dispatch(
        addData({
          botId,
          position: {
            openLevel,
            id: Math.floor(Math.random() * 666),
            status: PositionStatus.OPEN_PARTIAL,
            openedByRules: [openingRule],
            orders: [order],
            closingRules: DEFAULT_CLOSING_RULES,
            createdAt: new Date(),
            updatedAt: null,
            bot: null,
          },
        })
      )

      return
    }

    // сохраняем в бд
    const { manager } = db
    const position = await manager.save(
      manager.create(Position, {
        openLevel,
        status: PositionStatus.OPEN_PARTIAL,
        openedByRules: [openingRule],
        orders: [order],
        bot: { id: botId },
      })
    )

    // добавляем в стейт
    store.dispatch(
      addData({
        botId,
        position,
      })
    )
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      const type = LogType.ERROR
      const message = JSON.stringify(error)

      sendMessage(type, message)

      const { manager } = db
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
  placeOrder: () => Promise<Order>,
  botId: StoredBot['id'],
  position: Position,
  openingRule: PositionOpeningRule
) => {
  const openedByRules = [...position.openedByRules, openingRule]
  const status = getPositionNextStatus(openedByRules)

  // блочим уровень, если позиция открыта полностью
  if (status === PositionStatus.OPEN_FULL) {
    store.dispatch(
      editData({
        botId,
        level: {
          id: position.openLevel.id,
          status: LevelStatus.DISABLED_DURING_SESSION,
        },
        position: {
          id: position.id,
          openLevel: {
            ...position.openLevel,
            status: LevelStatus.DISABLED_DURING_SESSION,
          },
        },
      })
    )
  }

  try {
    // отправляем заявку
    const order = await placeOrder()

    // обновляем позицию в стейте
    store.dispatch(
      editData({
        botId,
        position: {
          id: position.id,
          status,
          openedByRules,
          orders: [...position.orders, order],
        },
      })
    )

    if (process.env.NODE_ENV === 'test') return

    const { manager } = db

    // обновляем позицию в бд
    await manager.update(Position, position.id, {
      status,
      openedByRules,
      orders: [...position.orders, order],
    })
  } catch (error) {
    // откатываем позицию в стейте
    store.dispatch(
      editData({
        botId,
        position,
      })
    )

    const type = LogType.ERROR
    const message = JSON.stringify(error)

    sendMessage(type, message)

    const { manager } = db

    manager.save(
      manager.create(Log, {
        type,
        message,
      })
    )
  }
}

export const closePosition = async (
  placeOrder: () => Promise<Order>,
  botId: StoredBot['id'],
  position: Position,
  closedByRule: Position['closedByRule'],
  disableLevel?: Level,
  closedLevel?: Level
) => {
  try {
    // отправляем заявку
    const order = await placeOrder()

    // обновляем стейт
    store.dispatch(
      editData({
        botId,
        position: {
          ...position,
          orders: [...position.orders, order],
          status: PositionStatus.CLOSED,
          closedByRule,
          closedLevel: disableLevel
            ? {
                ...disableLevel,
                status: LevelStatus.DISABLED_DURING_SESSION,
              }
            : closedLevel,
        },
        level: disableLevel
          ? {
              id: disableLevel.id,
              status: LevelStatus.DISABLED_DURING_SESSION,
            }
          : undefined,
      })
    )

    if (process.env.NODE_ENV === 'test') return

    // обновляем позицию в бд
    const { manager } = db

    await manager.update(Position, position.id, {
      orders: [...position.orders, order],
      status: PositionStatus.CLOSED,
      closedByRule,
      closedLevel,
    })
  } catch (error) {
    const type = LogType.ERROR
    const message = JSON.stringify(error)

    sendMessage(type, message)

    const { manager } = db

    manager.save(
      manager.create(Log, {
        type,
        message,
      })
    )
  }
}

export const updatePositionClosingRules = async (
  botId: StoredBot['id'],
  position: Position,
  closingRules: PositionClosingRule[]
) => {
  store.dispatch(
    editData({
      botId,
      position: {
        id: position.id,
        closingRules,
      },
    })
  )

  if (process.env.NODE_ENV === 'test') return

  try {
    const { manager } = db
    await manager.update(Position, position.id, { closingRules })
  } catch (error) {
    store.dispatch(
      editData({
        botId,
        position,
      })
    )
  }
}

jest.mock('telegraf')
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition } from '../strategy/utils'
import {
  PositionClosingRule,
  PositionStatus,
  PositionOpeningRule,
  LevelStatus,
} from '../db'
import { runStartegy } from '../strategy'
import { getTestBot, getTestLevels, getTestTrend } from './utils'

const placeOrder = jest.fn((data) => data)
const testBot = getTestBot()

describe('Take profit', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(
      editBot({
        id: testBot.id,
        status: testBot.status,
        positions: [],
        levels: getTestLevels([1, 2, 3, 4]),
      })
    )
  })

  store.dispatch(initBots([testBot]))

  test('по достижению следующего уровня в направлении тренда', async () => {
    // 3 --/-\--/-------- | 3, 4, 6
    //    /   \/          | 2, 5
    // 2 /--------------- | 1

    // 1. Открываем позицию в лонг на уровне 2
    await runStartegy(testBot.id, 2, placeOrder)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(2)

    // 2. Цена изменяется на 0.5 пунктов → держим позицию
    await runStartegy(testBot.id, 2.5, placeOrder)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(2)

    // 3. Цена достигает следующего уровня → закрываем позицию
    await runStartegy(testBot.id, 3, placeOrder)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(2)
    expect(position3.closedLevel.id).toBe(3)
    expect(position3.closedByRule).toBe(PositionClosingRule.TP)

    // 4. Цена держится на закрытом уровне → закрытый уровень выключен
    await runStartegy(testBot.id, 3.01, placeOrder)
    await runStartegy(testBot.id, 3, placeOrder)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.openLevel.id).toBe(2)
    expect(position4.closedLevel.id).toBe(3)

    const closedLevel4 = store
      .getState()
      .bots[0].levels.find((level) => level.id === 3)
    expect(closedLevel4.status).toBe(LevelStatus.DISABLED_DURING_SESSION)

    // 5. Цена отскакивает на 50% до следующего уровня против тренда → крайний закрытый уровень доступен к открытию
    await runStartegy(testBot.id, 2.5, placeOrder)

    const closedLevel5 = store
      .getState()
      .bots[0].levels.find((level) => level.id === 3)
    expect(closedLevel5.status).toBe(LevelStatus.ACTIVE)

    // 6. Цена возвращается на крайний закрытый уровень → открываем
    await runStartegy(testBot.id, 3, placeOrder)
    const position6 = getLastPosition(store.getState().bots[0])
    expect(position6.openLevel.id).toBe(3)
  })

  test('при отскоке к безубыточному уровню от середины расстояния до следующего уровня', async () => {
    // 3 ---------------- |
    //    ╱ ╲             | 2, 3
    // 2 ╱---╲-╱--------- | 1, 4

    // 1. Открываем позицию в лонг на уровне 2 и проскакиваем AFTER_LEVEL_3TICKS
    await runStartegy(testBot.id, 2, placeOrder)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(2)
    expect(position1.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ])
    )
    expect(position1.openedByRules).toEqual(
      expect.arrayContaining([PositionOpeningRule.ON_LEVEL])
    )

    // 2. Цена поднимается на 50% от уровня открытия → уровень доступен для закрытия в 0
    await runStartegy(testBot.id, 2.5, placeOrder)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(2)
    expect(position2.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_3TICKS,
      ])
    )

    // 3. Возвращается на 3 тика до средней цены → закрываем позицию
    await runStartegy(testBot.id, 2.03, placeOrder)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(2)
    expect(position3.closedByRule).toBe(PositionClosingRule.SLT_3TICKS)

    // 4. Закрытая позиция по стопу не открывается второй раз
    await runStartegy(testBot.id, 2, placeOrder)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.openLevel.id).toBe(2)
    expect(position4.closedByRule).toBe(PositionClosingRule.SLT_3TICKS)
  })

  test('при отскоке от 70% до середины', async () => {
    // 3 (23.96) ------------- |
    // 4 (23.51) ------------- |
    // 70%          ╱╲         | 2, 4
    // 50%         ╱  ╲╱╲      | 3
    // 2 (23.21) -╱------╲---- | 1, 5
    // 1 (22.99) --------------|

    store.dispatch(
      editBot({
        id: testBot.id,
        levels: getTestLevels([22.99, 23.21, 23.96, 23.51]),
      })
    )

    // 1. Открываем позицию в лонг на уровне 2
    await runStartegy(testBot.id, 23.21, placeOrder)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(2)
    expect(position1.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ])
    )

    // 2. Цена поднимается на 70% (+0.21) от уровня открытия → доступно закрытие по правилу SLT_50PERCENT
    await runStartegy(testBot.id, 23.42, placeOrder)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(2)
    expect(position2.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_3TICKS,
        PositionClosingRule.SLT_50PERCENT,
      ])
    )

    // 3. Цена возвращается на 50% (+0.15) → закрываем позицию и блокируем открытый уровень
    await runStartegy(testBot.id, 23.36, placeOrder)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(2)
    expect(position3.closedByRule).toBe(PositionClosingRule.SLT_50PERCENT)

    const closedLevel3 = store
      .getState()
      .bots[0].levels.find((level) => level.id === 2)
    expect(closedLevel3.status).toBe(LevelStatus.DISABLED_DURING_SESSION)

    // 4. Цена поднимается выше 50% → закрытый уровень доступен к открытию
    await runStartegy(testBot.id, 23.39, placeOrder)
    const closedLevel4 = store
      .getState()
      .bots[0].levels.find((level) => level.id === 2)
    expect(closedLevel4.status).toBe(LevelStatus.ACTIVE)

    // 5. Цена возвращается на уровень → открываем
    await runStartegy(testBot.id, 23.21, placeOrder)
    const position5 = getLastPosition(store.getState().bots[0])
    expect(position5.openLevel.id).toBe(2)
  })

  test('не закрываем позицию по TP на этом же уровне', async () => {
    // 3 ------------ |
    //       ╱╲       | 4
    // 2 ╱╲-╱--╲----- | 1, 2, 3, 5

    // 1. Открываем позицию в лонг на уровне 2
    await runStartegy(testBot.id, 2, placeOrder)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(2)
    expect(position1.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ])
    )

    // 2. Цена поднимается на 40% от уровня открытия → без изменений
    await runStartegy(testBot.id, 2.4, placeOrder)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(2)
    expect(position2.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ])
    )

    // 3. Цена падает на уровень открытия → позиция остается открытой
    await runStartegy(testBot.id, 2, placeOrder)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(2)
    expect(position3.closedByRule).toBeUndefined()

    // 4. Цена поднимается на 50% от уровня открытия → добавляем правило закрытия по SLT_3TICKS
    await runStartegy(testBot.id, 2.5, placeOrder)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.openLevel.id).toBe(2)
    expect(position4.closingRules).toEqual(
      expect.arrayContaining([
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_3TICKS,
      ])
    )

    // 5. Цена падает на уровень открытия → закрываем по SLT_3TICKS
    await runStartegy(testBot.id, 2, placeOrder)
    const position5 = getLastPosition(store.getState().bots[0])
    expect(position5.openLevel.id).toBe(2)
    expect(position5.closedByRule).toBe(PositionClosingRule.SLT_3TICKS)
  })

  test('при даунтренде', async () => {
    // 3 (23.96) -╲-------------- 1
    // 50%         ╲  ╱╲
    // 70%          ╲╱  ╲         2
    // 4 (23.51) --------╲------- 3
    // 50%                ╲╱╲     4
    // 2 (23.21) ------------╲--- 5
    //                        ╲
    // 1 (22.99) --------------╲- 6

    store.dispatch(
      editBot({
        id: testBot.id,
        levels: getTestLevels([22.99, 23.21, 23.96, 23.51, 24.14]),
        trends: [getTestTrend(true)],
      })
    )

    // 1. Открывем позицию 23.51 в шорт
    await runStartegy(testBot.id, 23.96, placeOrder)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(3)

    // 2. SLT_50PERCENT при отскоке от 70% до следующего уровня
    await runStartegy(testBot.id, 23.64, placeOrder)
    expect(getLastPosition(store.getState().bots[0]).closingRules).toContain(
      PositionClosingRule.SLT_50PERCENT
    )

    await runStartegy(testBot.id, 23.74, placeOrder)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.status).toBe(PositionStatus.CLOSED)
    expect(position2.closedByRule).toBe(PositionClosingRule.SLT_50PERCENT)

    // 3. Открывем позицию 23.51
    await runStartegy(testBot.id, 23.51, placeOrder)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(4)
    expect(position3.closingRules).not.toContain(PositionClosingRule.SLT_3TICKS)

    // 4. Закрываем при отскоке от 50% по правилу SLT_3TICKS
    await runStartegy(testBot.id, 23.34, placeOrder)
    expect(getLastPosition(store.getState().bots[0]).closingRules).toContain(
      PositionClosingRule.SLT_3TICKS
    )
    // 4.1. Прострел 2 тика до уровня, чтобы не усреднять
    await runStartegy(testBot.id, 23.49, placeOrder)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.status).toBe(PositionStatus.CLOSED)
    expect(position4.closedByRule).toBe(PositionClosingRule.SLT_3TICKS)

    // 5. Открываем позицию 23.21
    await runStartegy(testBot.id, 23.21, placeOrder)
    const position5 = getLastPosition(store.getState().bots[0])
    expect(position5.openLevel.id).toBe(2)

    // 6. Закрываем по TP
    await runStartegy(testBot.id, 22.99, placeOrder)
    const position6 = getLastPosition(store.getState().bots[0])
    expect(position6.status).toBe(PositionStatus.CLOSED)
    expect(position6.closedByRule).toBe(PositionClosingRule.TP)
  })
})

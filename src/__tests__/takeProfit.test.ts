jest.mock('telegraf')
import store from '../store'
import { initLevels, selectLevels } from '../store/levels'
import { selectLastPosition, initPositions } from '../store/positions'
import {
  PositionClosingRule,
  PositionStatus,
  PositionOpeningRule,
} from '../db/Position'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { runStartegy } from '../strategy'

const placeOrder = jest.fn((data) => data)

describe('Take profit', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [1, 2, 3, 4].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  beforeEach(() => {
    store.dispatch(initPositions([]))
    store.dispatch(initLevels(levels))
  })

  test('по достижению следующего уровня в направлении тренда', () => {
    // 3 --/-\--/-------- | 3, 4, 6
    //    /   \/          | 2, 5
    // 2 /--------------- | 1

    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // 1. Открываем позицию в лонг на уровне 2
    runStartegy(1.9, 2, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1.openLevelId).toBe(2)

    // 2. Цена изменяется на 0.5 пунктов → держим позицию
    runStartegy(2.4, 2.5, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2.openLevelId).toBe(2)

    // 3. Цена достигает следующего уровня → закрываем позицию
    runStartegy(2.9, 3, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedLevelId: 3,
      closedByRule: PositionClosingRule.TP,
    })

    // 4. Цена держится на закрытом уровне → закрытый уровень выключен
    runStartegy(3, 3.1, placeOrder)
    runStartegy(2.9, 3, placeOrder)
    const position4 = selectLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: 2,
      closedLevelId: 3,
    })
    const closedLevel4 = selectLevels(store.getState()).find(
      (level) => level.id === 3
    )
    expect(closedLevel4).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: true,
    })

    // 5. Цена отскакивает на 50% до следующего уровня против тренда → крайний закрытый уровень доступен к открытию
    runStartegy(2.4, 2.5, placeOrder)
    const closedLevel5 = selectLevels(store.getState()).find(
      (level) => level.id === 3
    )
    expect(closedLevel5).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: false,
    })

    // 6. Цена возвращается на крайний закрытый уровень → открываем
    runStartegy(2.9, 3, placeOrder)
    const position6 = selectLastPosition(store.getState())
    expect(position6).toMatchObject<Partial<typeof position6>>({
      openLevelId: 3,
    })
  })

  test('при отскоке к безубыточному уровню от середины расстояния до следующего уровня', () => {
    // 3 ---------------- |
    //    ╱ ╲             | 2, 3
    // 2 ╱---╲-╱--------- | 1, 4

    // 1. Открываем позицию в лонг на уровне 2
    runStartegy(1.99, 2, placeOrder)
    runStartegy(2.02, 2.03, placeOrder) // открываем по AFTER_LEVEL_3TICKS, чтобы закрыться по стопу
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ],
      openedByRules: [
        PositionOpeningRule.ON_LEVEL,
        PositionOpeningRule.AFTER_LEVEL_3TICKS,
      ],
    })

    // 2. Цена поднимается на 50% от уровня открытия → уровень доступен для закрытия в 0
    runStartegy(2.49, 2.5, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_3TICKS,
      ],
    })

    // 3. Возвращается на 3 тика до средней цены → закрываем позицию
    runStartegy(2.02, 2.03, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SLT_3TICKS,
    })

    // 4. Закрытая позиция по стопу не открывается второй раз
    runStartegy(1.9, 2, placeOrder)
    const position4 = selectLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SLT_3TICKS,
    })
  })

  test('при отскоке от 70% до середины', () => {
    // 3 (23.96) ------------- |
    // 4 (23.51) ------------- |
    // 70%          ╱╲         | 2, 4
    // 50%         ╱  ╲╱╲      | 3
    // 2 (23.21) -╱------╲---- | 1, 5
    // 1 (22.99) --------------|

    const levels = [22.99, 23.21, 23.96, 23.51].map((value, key) => ({
      value,
      id: key + 1,
      isDisabled: false,
    }))

    store.dispatch(initLevels(levels))

    // 1. Открываем позицию в лонг на уровне 2
    runStartegy(23.2, 23.21, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ],
    })

    // 2. Цена поднимается на 70% (+0.21) от уровня открытия → доступно закрытие по правилу SLT_50PERCENT
    runStartegy(23.41, 23.42, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_3TICKS,
        PositionClosingRule.SLT_50PERCENT,
      ],
    })

    // 3. Цена возвращается на 50% (+0.15) → закрываем позицию и блокируем открытый уровень
    runStartegy(23.35, 23.36, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SLT_50PERCENT,
    })

    const closedLevel3 = selectLevels(store.getState()).find(
      (level) => level.id === 2
    )
    expect(closedLevel3).toMatchObject<Partial<typeof closedLevel3>>({
      isDisabled: true,
    })

    // 4. Цена поднимается выше 50% → закрытый уровень доступен к открытию
    runStartegy(23.38, 23.39, placeOrder)
    const closedLevel4 = selectLevels(store.getState()).find(
      (level) => level.id === 2
    )
    expect(closedLevel4).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: false,
    })

    // 5. Цена возвращается на уровень → открываем
    runStartegy(23.2, 23.21, placeOrder)
    const position5 = selectLastPosition(store.getState())
    expect(position5).toMatchObject<Partial<typeof position5>>({
      openLevelId: 2,
    })
  })

  test('не закрываем позицию по TP на этом же уровне', async () => {
    // 3 ------------ |
    //       ╱╲       | 4
    // 2 ╱╲-╱--╲----- | 1, 2, 3, 5

    // 1. Открываем позицию в лонг на уровне 2
    runStartegy(1.9, 2, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ],
    })

    // 2. Цена поднимается на 40% от уровня открытия → без изменений
    runStartegy(2.3, 2.4, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ],
    })

    // 3. Цена падает на уровень открытия → позиция остается открытой
    runStartegy(1.9, 2, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3.openLevelId).toBe(2)
    expect(position3.closedByRule).toBeUndefined()

    // 4. Цена поднимается на 50% от уровня открытия → добавляем правило закрытия по SLT_3TICKS
    runStartegy(2.4, 2.5, placeOrder)
    const position4 = selectLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_3TICKS,
      ],
    })

    // 5. Цена падает на уровень открытия → закрываем по SLT_3TICKS
    runStartegy(1.9, 2, placeOrder)
    const position5 = selectLastPosition(store.getState())
    expect(position5).toMatchObject<Partial<typeof position5>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SLT_3TICKS,
    })
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

    const levels = [22.99, 23.21, 23.96, 23.51, 24.14].map((value, key) => ({
      value,
      id: key + 1,
      isDisabled: false,
    }))

    store.dispatch(initLevels(levels))
    store.dispatch(
      addTrend({ direction: TrendDirection.DOWN, type: TrendType.MANUAL })
    )

    // 1. Открывем позицию 23.51 в шорт
    await runStartegy(23.96, 23.96, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1.openLevelId).toBe(3)

    // 2. SLT_50PERCENT при отскоке от 70% до следующего уровня
    await runStartegy(23.64, 23.65, placeOrder)
    expect(selectLastPosition(store.getState()).closingRules).toContain(
      PositionClosingRule.SLT_50PERCENT
    )

    await runStartegy(23.74, 23.75, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2.status).toBe(PositionStatus.CLOSED)
    expect(position2.closedByRule).toBe(PositionClosingRule.SLT_50PERCENT)

    // 3. Открывем позицию 23.51
    await runStartegy(23.51, 23.52, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3.openLevelId).toBe(4)
    expect(position3.closingRules).not.toContain(PositionClosingRule.SLT_3TICKS)

    // 4. Закрываем при отскоке от 50% по правилу SLT_3TICKS
    await runStartegy(23.34, 23.35, placeOrder)
    expect(selectLastPosition(store.getState()).closingRules).toContain(
      PositionClosingRule.SLT_3TICKS
    )
    // 4.1. Прострел 2 тика до уровня, чтобы не усреднять
    await runStartegy(23.49, 23.5, placeOrder)
    const position4 = selectLastPosition(store.getState())
    expect(position4.status).toBe(PositionStatus.CLOSED)
    expect(position4.closedByRule).toBe(PositionClosingRule.SLT_3TICKS)

    // 5. Открываем позицию 23.21
    await runStartegy(23.21, 23.22, placeOrder)
    const position5 = selectLastPosition(store.getState())
    expect(position5.openLevelId).toBe(2)

    // 6. Закрываем по TP
    await runStartegy(22.99, 23, placeOrder)
    const position6 = selectLastPosition(store.getState())
    expect(position6.status).toBe(PositionStatus.CLOSED)
    expect(position6.closedByRule).toBe(PositionClosingRule.TP)
  })
})

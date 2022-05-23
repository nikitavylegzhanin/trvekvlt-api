jest.mock('telegraf')
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import { TrendDirection, PositionStatus, PositionOpeningRule } from '../db'
import { runStartegy } from '../strategy'
import { getTestBot, getTestLevels, getTestTrend, mockPrice } from './utils'

const testBot = getTestBot()

describe('Открытие позиции в направлении тренда', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(
      editBot({
        id: testBot.id,
        positions: [],
        levels: getTestLevels([1, 2, 3, 4, 5]),
      })
    )
  })

  store.dispatch(initBots([testBot]))

  test('по bid price для аптренда', async () => {
    const trendA = getLastTrend(store.getState().bots[0])
    expect(trendA.direction).toBe(TrendDirection.UP)

    // Изначально нет открытых позиций
    const positionA = getLastPosition(store.getState().bots[0])
    expect(positionA).toBeUndefined()

    await runStartegy(testBot.id, ...mockPrice(2))

    const positionB = getLastPosition(store.getState().bots[0])
    expect(positionB.openLevel.id).toBe(2)
  })

  test('по ask price для даунтрейда', async () => {
    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend(true)] }))

    const positionA = getLastPosition(store.getState().bots[0])
    expect(positionA).toBeUndefined()

    await runStartegy(testBot.id, ...mockPrice(3))

    const positionB = getLastPosition(store.getState().bots[0])
    expect(positionB.openLevel.id).toBe(3)

    // Только одна открытая заявка
    await runStartegy(testBot.id, ...mockPrice(3))
    const { positions } = store.getState().bots[0]
    expect(positions).toHaveLength(1)
  })

  test('не открывает крайние уровни', async () => {
    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend()] }))

    // Верхний уровень
    await runStartegy(testBot.id, ...mockPrice(5))
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1).toBeUndefined()

    // Нижний уровень
    await runStartegy(testBot.id, ...mockPrice(1))
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2).toBeUndefined()
  })

  test('открывает в 3 шага в лонг', async () => {
    // 3: ---------╱- 5
    //         ⎽  ╱   4
    // 2: ----╱-╲╱--- 2, 3
    //      ⎽╱        1
    //     ╱

    const trend = getLastTrend(store.getState().bots[0])
    expect(trend.direction).toBe(TrendDirection.UP)

    // 1. За 3 тика до уровня BEFORE_LEVEL_3TICKS
    await runStartegy(testBot.id, ...mockPrice(1.97))
    const lastPosition1 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1.openLevel.id).toBe(2)
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition1.openedByRules).toContainEqual(
      PositionOpeningRule['BEFORE_LEVEL_3TICKS']
    )

    // 2. На уровне
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition2.openedByRules).toContain(
      PositionOpeningRule['ON_LEVEL']
    )

    // 3. Правило не дублируем
    await runStartegy(testBot.id, ...mockPrice(2.02))
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3.openedByRules).toEqual([
      PositionOpeningRule['BEFORE_LEVEL_3TICKS'],
      PositionOpeningRule['ON_LEVEL'],
    ])

    // 4. После 3 тиков от уровня - позиция полностью открыта
    await runStartegy(testBot.id, ...mockPrice(2.03))
    const lastPosition4 = getLastPosition(store.getState().bots[0])
    expect(lastPosition4.status).toBe(PositionStatus['OPEN_FULL'])
    expect(lastPosition4.openedByRules).toEqual([
      PositionOpeningRule['BEFORE_LEVEL_3TICKS'],
      PositionOpeningRule['ON_LEVEL'],
      PositionOpeningRule['AFTER_LEVEL_3TICKS'],
    ])

    // 5. Закроем позицию
    await runStartegy(testBot.id, ...mockPrice(3))
    const lastPosition5 = getLastPosition(store.getState().bots[0])
    expect(lastPosition5.status).toBe(PositionStatus['CLOSED'])
  })

  test('открывает в 3 шага в шорт', async () => {
    //    ╲       1
    // 2: -╲----- 2
    //      ╲     3
    // 1: ---╲--- 4

    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend(true)] }))

    // 1. За 3 тика до уровня BEFORE_LEVEL_3TICKS
    await runStartegy(testBot.id, ...mockPrice(2.03))
    const lastPosition1 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1.openLevel.id).toBe(2)
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition1.openedByRules).toContainEqual(
      PositionOpeningRule['BEFORE_LEVEL_3TICKS']
    )

    // 2. На уровне
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition2.openedByRules).toContain(
      PositionOpeningRule['ON_LEVEL']
    )

    // 3. После 3 тиков от уровня - позиция полностью открыта
    await runStartegy(testBot.id, ...mockPrice(1.97))
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3.status).toBe(PositionStatus['OPEN_FULL'])
    expect(lastPosition3.openedByRules).toEqual([
      PositionOpeningRule['BEFORE_LEVEL_3TICKS'],
      PositionOpeningRule['ON_LEVEL'],
      PositionOpeningRule['AFTER_LEVEL_3TICKS'],
    ])

    // 4. Закроем позицию
    await runStartegy(testBot.id, ...mockPrice(1))
    const lastPosition4 = getLastPosition(store.getState().bots[0])
    expect(lastPosition4.status).toBe(PositionStatus['CLOSED'])
  })
})

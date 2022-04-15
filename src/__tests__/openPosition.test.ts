jest.mock('telegraf')
import store from '../store'
import { addLevels } from '../store/levels'
import { selectLastPosition, initPositions } from '../store/positions'
import { addTrend, selectLastTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { PositionOpeningRule, PositionStatus } from '../db/Position'
import { runStartegy } from '../strategy'

const placeOrder = jest.fn((data) => data)

describe('Открытие позиции в направлении тренда', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(initPositions([]))
  })

  const bid = 2
  const ask = 3
  const levels = [1, bid, ask, 4, 5].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  store.dispatch(addLevels(levels))

  test('по bid price для аптренда', () => {
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // Изначально нет открытых позиций
    const positionA = selectLastPosition(store.getState())
    expect(positionA).toBeUndefined()

    runStartegy(ask, bid, placeOrder)

    const positionB = selectLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      openLevelId: levels.find(({ value }) => value === bid).id,
    })
  })

  test('по ask price для даунтрейда', () => {
    store.dispatch(
      addTrend({ direction: TrendDirection.DOWN, type: TrendType.MANUAL })
    )

    const positionA = selectLastPosition(store.getState())
    expect(positionA).toBeUndefined()

    runStartegy(ask, bid, placeOrder)

    const positionB = selectLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })

    // Только одна открытая заявка
    runStartegy(4, bid, placeOrder)
    const positionC = selectLastPosition(store.getState())
    expect(positionC).toMatchObject<Partial<typeof positionC>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })
  })

  test('не открывает крайние уровни', async () => {
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // Верхний уровень
    runStartegy(4.9, 5, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toBeUndefined()

    // Нижний уровень
    runStartegy(0.9, 1, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toBeUndefined()
  })

  test('открывает в 3 шага в лонг', async () => {
    // 3: ---------╱- 5
    //         ⎽  ╱   4
    // 2: ----╱-╲╱--- 2, 3
    //      ⎽╱        1
    //     ╱

    const trend = selectLastTrend(store.getState())
    expect(trend.direction).toBe(TrendDirection.UP)

    // 1. За 3 тика до уровня BEFORE_LEVEL_3TICKS
    await runStartegy(1.96, 1.97, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1.openLevelId).toBe(2)
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition1.openedByRules).toContainEqual(
      PositionOpeningRule['BEFORE_LEVEL_3TICKS']
    )

    // 2. На уровне
    await runStartegy(1.99, 2, placeOrder)
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition2.openedByRules).toContain(
      PositionOpeningRule['ON_LEVEL']
    )

    // 3. Правило не дублируем
    await runStartegy(2.01, 2.02, placeOrder)
    await runStartegy(1.99, 2, placeOrder)
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3.openedByRules).toEqual([
      PositionOpeningRule['BEFORE_LEVEL_3TICKS'],
      PositionOpeningRule['ON_LEVEL'],
    ])

    // 4. После 3 тиков от уровня - позиция полностью открыта
    await runStartegy(2.02, 2.03, placeOrder)
    const lastPosition4 = selectLastPosition(store.getState())
    expect(lastPosition4.status).toBe(PositionStatus['OPEN_FULL'])
    expect(lastPosition4.openedByRules).toEqual([
      PositionOpeningRule['BEFORE_LEVEL_3TICKS'],
      PositionOpeningRule['ON_LEVEL'],
      PositionOpeningRule['AFTER_LEVEL_3TICKS'],
    ])

    // 5. Закроем позицию
    await runStartegy(2.99, 3, placeOrder)
    const lastPosition5 = selectLastPosition(store.getState())
    expect(lastPosition5.status).toBe(PositionStatus['CLOSED'])
  })

  test('открывает в 3 шага в шорт', async () => {
    //    ╲       1
    // 2: -╲----- 2
    //      ╲     3
    // 1: ---╲--- 4

    store.dispatch(
      addTrend({ direction: TrendDirection.DOWN, type: TrendType.MANUAL })
    )

    // 1. За 3 тика до уровня BEFORE_LEVEL_3TICKS
    await runStartegy(2.03, 2.04, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1.openLevelId).toBe(2)
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition1.openedByRules).toContainEqual(
      PositionOpeningRule['BEFORE_LEVEL_3TICKS']
    )

    // 2. На уровне
    await runStartegy(2, 2.01, placeOrder)
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition1.status).toBe(PositionStatus['OPEN_PARTIAL'])
    expect(lastPosition2.openedByRules).toContain(
      PositionOpeningRule['ON_LEVEL']
    )

    // 3. После 3 тиков от уровня - позиция полностью открыта
    await runStartegy(1.97, 1.98, placeOrder)
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3.status).toBe(PositionStatus['OPEN_FULL'])
    expect(lastPosition3.openedByRules).toEqual([
      PositionOpeningRule['BEFORE_LEVEL_3TICKS'],
      PositionOpeningRule['ON_LEVEL'],
      PositionOpeningRule['AFTER_LEVEL_3TICKS'],
    ])

    // 4. Закроем позицию
    await runStartegy(1, 1.01, placeOrder)
    const lastPosition4 = selectLastPosition(store.getState())
    expect(lastPosition4.status).toBe(PositionStatus['CLOSED'])
  })
})

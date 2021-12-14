import store from '../store'
import { addLevels } from '../store/levels'
import { selectLastPosition, initPositions } from '../store/positions'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { runStartegy } from '../strategy'

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

    runStartegy(ask, bid)

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

    runStartegy(ask, bid)

    const positionB = selectLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })

    // Только одна открытая заявка
    runStartegy(4, bid)
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
    runStartegy(4.9, 5)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toBeUndefined()

    // Нижний уровень
    runStartegy(0.9, 1)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toBeUndefined()
  })
})

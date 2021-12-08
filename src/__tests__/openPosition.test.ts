import store from '../store'
import { addLevels } from '../store/levels'
import { selectLastPosition, initPositions } from '../store/positions'
import { changePrice } from '../store/price'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'

describe('Открытие позиции в направлении тренда', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(initPositions([]))
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
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

    store.dispatch(changePrice({ ask, bid }))

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

    store.dispatch(changePrice({ ask, bid }))

    const positionB = selectLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })

    // Только одна открытая заявка
    store.dispatch(changePrice({ ask: 4, bid }))
    const positionC = selectLastPosition(store.getState())
    expect(positionC).toMatchObject<Partial<typeof positionC>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })
  })

  test('не открывает крайние уровни', () => {
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // Верхний уровень
    store.dispatch(changePrice({ ask: 4.9, bid: 5 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1).toBeUndefined()

    // Нижний уровень
    store.dispatch(changePrice({ ask: 0.9, bid: 1 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2).toBeUndefined()
  })
})

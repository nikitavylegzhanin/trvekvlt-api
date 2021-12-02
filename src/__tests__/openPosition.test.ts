import store from '../store'
import { addLevels } from '../store/levels'
import { selectLastPosition, resetPositions } from '../store/positions'
import { changePrice } from '../store/price'
import { addTrend, TrendDirection } from '../store/trends'

describe('Открытие позиции в направлении тренда', () => {
  beforeEach(() => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
  })

  const bid = 1
  const ask = 2
  const levels = [bid, ask, 3].map((value) => ({
    value,
    id: value.toString(),
    isDisabled: false,
  }))

  store.dispatch(addLevels(levels))

  test('по bid price для аптренда', () => {
    store.dispatch(addTrend({ id: '1', direction: TrendDirection.UP }))

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
    store.dispatch(addTrend({ id: '2', direction: TrendDirection.DOWN }))

    const positionA = selectLastPosition(store.getState())
    expect(positionA).toBeUndefined()

    store.dispatch(changePrice({ ask, bid }))

    const positionB = selectLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })

    // Только одна открытая заявка
    store.dispatch(changePrice({ ask: 3, bid }))
    const positionC = selectLastPosition(store.getState())
    expect(positionC).toMatchObject<Partial<typeof positionC>>({
      openLevelId: levels.find(({ value }) => value === ask).id,
    })
  })
})

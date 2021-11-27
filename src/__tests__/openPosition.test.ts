import store, {
  addTrend,
  addLevels,
  TrendDirection,
  changePrice,
  getLastPosition,
  resetPositions,
} from '../store'

describe('Открытие позиции в направлении тренда', () => {
  beforeEach(() => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
  })

  const bid = 1
  const ask = 2
  const levels = [bid, ask].map((value) => ({ value, id: value.toString() }))

  store.dispatch(addLevels(levels))

  test('по bid price для аптренда', () => {
    store.dispatch(addTrend({ id: '1', direction: TrendDirection.UP }))

    const positionA = getLastPosition(store.getState())
    expect(positionA).toBeUndefined()

    store.dispatch(changePrice({ ask, bid }))

    const positionB = getLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      levelId: levels.find(({ value }) => value === bid).id,
    })
  })

  test('по ask price для даунтрейда', () => {
    store.dispatch(addTrend({ id: '2', direction: TrendDirection.DOWN }))

    const positionA = getLastPosition(store.getState())
    expect(positionA).toBeUndefined()

    store.dispatch(changePrice({ ask, bid }))

    const positionB = getLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({
      levelId: levels.find(({ value }) => value === ask).id,
    })
  })
})

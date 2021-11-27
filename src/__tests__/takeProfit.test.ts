import store, {
  changePrice,
  getLastPosition,
  resetPositions,
  addLevels,
  addTrend,
  TrendDirection,
} from '../store'

describe('Take profit', () => {
  beforeEach(() => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
  })

  const levels = [1, 2, 3, 4].map((value) => ({ value, id: value.toString() }))

  store.dispatch(addLevels(levels))

  test('по достижению следующего уровня в направлении тренда', () => {
    store.dispatch(addTrend({ id: '1', direction: TrendDirection.UP }))

    // Открываем позицию в лонг на уровне 2
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const positionA = getLastPosition(store.getState())
    expect(positionA).toMatchObject<Partial<typeof positionA>>({ levelId: '2' })

    // Цена изменяется на 0.5 пунктов → держим позицию
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const positionB = getLastPosition(store.getState())
    expect(positionB).toMatchObject<Partial<typeof positionB>>({ levelId: '2' })

    // Цена достигает следующего уровня → закрываем позицию
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    const positionC = getLastPosition(store.getState())
    expect(positionC).toMatchObject<Partial<typeof positionC>>({
      levelId: '2',
      isClosed: true,
    })
  })
})

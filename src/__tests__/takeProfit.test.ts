import store, {
  changePrice,
  getLastPosition,
  resetPositions,
  addLevels,
  addTrend,
  TrendDirection,
  getLevels,
  ClosingRule,
} from '../store'

describe('Take profit', () => {
  beforeEach(() => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
  })

  const levels = [1, 2, 3, 4].map((value) => ({
    value,
    id: value.toString(),
    isDisabled: false,
  }))

  store.dispatch(addLevels(levels))

  test('по достижению следующего уровня в направлении тренда', () => {
    // 3 --/-\--/-------- | 3, 4, 6
    //    /   \/          | 2, 5
    // 2 /--------------- | 1

    store.dispatch(addTrend({ id: '1', direction: TrendDirection.UP }))

    // 1. Открываем позицию в лонг на уровне 2
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = getLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: '2',
    })

    // 2. Цена изменяется на 0.5 пунктов → держим позицию
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const position2 = getLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: '2',
    })

    // 3. Цена достигает следующего уровня → закрываем позицию
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    const position3 = getLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: '2',
      closedLevelId: '3',
      closedByRule: ClosingRule.TP,
    })

    // 4. Цена держится на закрытом уровне → закрытый уровень выключен
    store.dispatch(changePrice({ ask: 3, bid: 3.1 }))
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    const position4 = getLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: '2',
      closedLevelId: '3',
    })
    const closedLevel4 = getLevels(store.getState()).find(
      (level) => level.id === '3'
    )
    expect(closedLevel4).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: true,
    })

    // 5. Цена отскакивает на 50% до следующего уровня против тренда → крайний закрытый уровень доступен к открытию
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const closedLevel5 = getLevels(store.getState()).find(
      (level) => level.id === '3'
    )
    expect(closedLevel5).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: false,
    })

    // 6. Цена возвращается на крайний закрытый уровень → открываем
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    const position6 = getLastPosition(store.getState())
    expect(position6).toMatchObject<Partial<typeof position6>>({
      openLevelId: '3',
    })
  })

  test('при отскоке к безубыточному уровню от середины расстояния до следующего уровня', () => {
    // 3 ---------------- |
    //    ╱ ╲             | 2, 3
    // 2 ╱---╲-╱--------- | 1, 4

    // 1. Открываем позицию в лонг на уровне 2
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = getLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: '2',
      closingRules: [ClosingRule.TP],
    })

    // 2. Цена поднимается на 50% от уровня открытия -> уровень доступен для закрытия в 0
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const position2 = getLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: '2',
      closingRules: [ClosingRule.TP, ClosingRule.SLT_3TICKS],
    })

    // 3. Возвращается на 3 тика до средней цены → закрываем позицию
    store.dispatch(changePrice({ ask: 2.2, bid: 2.3 }))
    const position3 = getLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: '2',
      isClosed: true,
      closedByRule: ClosingRule.SLT_3TICKS,
    })

    // 4. Закрытая позиция по стопу не открывается второй раз
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position4 = getLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: '2',
      isClosed: true,
      closedByRule: ClosingRule.SLT_3TICKS,
    })
  })
})

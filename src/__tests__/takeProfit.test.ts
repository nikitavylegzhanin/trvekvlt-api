import store from '../store'
import { initLevels, selectLevels } from '../store/levels'
import { selectLastPosition, resetPositions } from '../store/positions'
import { PositionClosingRule } from '../db/Position'
import { changePrice } from '../store/price'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'

describe('Take profit', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [1, 2, 3, 4].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  beforeEach(() => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
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
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1.openLevelId).toBe(2)

    // 2. Цена изменяется на 0.5 пунктов → держим позицию
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2.openLevelId).toBe(2)

    // 3. Цена достигает следующего уровня → закрываем позицию
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedLevelId: 3,
      closedByRule: PositionClosingRule.TP,
    })

    // 4. Цена держится на закрытом уровне → закрытый уровень выключен
    store.dispatch(changePrice({ ask: 3, bid: 3.1 }))
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
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
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const closedLevel5 = selectLevels(store.getState()).find(
      (level) => level.id === 3
    )
    expect(closedLevel5).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: false,
    })

    // 6. Цена возвращается на крайний закрытый уровень → открываем
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
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
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ],
    })

    // 2. Цена поднимается на 50% от уровня открытия → уровень доступен для закрытия в 0
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
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
    store.dispatch(changePrice({ ask: 2.2, bid: 2.3 }))
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SLT_3TICKS,
    })

    // 4. Закрытая позиция по стопу не открывается второй раз
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position4 = selectLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SLT_3TICKS,
    })
  })

  test('при отскоке от 70% до середины', () => {
    // 3 ----------------- |
    // 70%  ╱╲             | 2, 4
    // 50% ╱  ╲╱╲          | 3
    // 2 -╱------╲-------- | 1, 5

    // 1. Открываем позицию в лонг на уровне 2
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
      ],
    })

    // 2. Цена поднимается на 70% от уровня открытия → доступено закрытие по правилу SLT_50PERCENT
    store.dispatch(changePrice({ ask: 2.6, bid: 2.7 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 2,
      closingRules: [
        PositionClosingRule.SL,
        PositionClosingRule.TP,
        PositionClosingRule.MARKET_PHASE_END,
        PositionClosingRule.SLT_50PERCENT,
      ],
    })

    // 3. Цена возвращается на 50% → закрываем позицию и блокируем открытый уровень
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
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
    store.dispatch(changePrice({ ask: 2.5, bid: 2.6 }))
    const closedLevel4 = selectLevels(store.getState()).find(
      (level) => level.id === 2
    )
    expect(closedLevel4).toMatchObject<Partial<typeof closedLevel4>>({
      isDisabled: false,
    })

    // 5. Цена возвращается на уровень → открываем
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position5 = selectLastPosition(store.getState())
    expect(position5).toMatchObject<Partial<typeof position5>>({
      openLevelId: 2,
    })
  })
})

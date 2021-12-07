import store from '../store'
import { changePrice } from '../store/price'
import { addLevels } from '../store/levels'
import { addTrend, selectLastTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { selectLastPosition } from '../store/positions'
import { PositionClosingRule } from '../db/Position'

describe('Correction', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [1, 2, 3].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  store.dispatch(addLevels(levels))

  it('меняет направление тренда при 2 SL подряд', () => {
    // 1. Аптренд
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )
    const lastTrend1 = selectLastTrend(store.getState())
    expect(lastTrend1).toMatchObject<Partial<typeof lastTrend1>>({
      direction: TrendDirection.UP,
    })

    // 2. Открываем позицию
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2.openLevelId).toBe(2)
    expect(lastPosition2.closedByRule).toBeUndefined()

    // 3. Закрываем по стопу
    store.dispatch(changePrice({ ask: 1.4, bid: 1.5 }))
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3).toMatchObject<Partial<typeof lastPosition3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 4. Открываем еще одну
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition4 = selectLastPosition(store.getState())
    expect(lastPosition4.openLevelId).toBe(2)
    expect(lastPosition4.closedByRule).toBeUndefined()

    // 5. Закрываем по стопу повторно
    store.dispatch(changePrice({ ask: 1.4, bid: 1.5 }))
    const lastPosition5 = selectLastPosition(store.getState())
    expect(lastPosition5).toMatchObject<Partial<typeof lastPosition5>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 6. Тренд изменен на обратный по коррекции
    const lastTrend6 = selectLastTrend(store.getState())
    expect(lastTrend6).toMatchObject<Partial<typeof lastTrend6>>({
      direction: TrendDirection.DOWN,
      type: TrendType.CORRECTION,
    })
  })
})

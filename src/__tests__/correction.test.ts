import store from '../store'
import { changePrice } from '../store/price'
import { addLevels } from '../store/levels'
import { addTrend, TrendDirection, selectLastTrend } from '../store/trends'
import { selectLastPosition, ClosingRule } from '../store/positions'

describe('Correction', () => {
  const levels = [1, 2, 3].map((value) => ({
    value,
    id: value.toString(),
    isDisabled: false,
  }))

  store.dispatch(addLevels(levels))

  it('меняет направление тренда при 2 SL подряд', () => {
    // 1. Аптренд
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, isCorrection: false })
    )
    const lastTrend1 = selectLastTrend(store.getState())
    expect(lastTrend1).toMatchObject<Partial<typeof lastTrend1>>({
      direction: TrendDirection.UP,
    })

    // 2. Открываем позицию
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2).toMatchObject<Partial<typeof lastPosition2>>({
      openLevelId: '2',
    })

    // 3. Закрываем по стопу
    store.dispatch(changePrice({ ask: 1.4, bid: 1.5 }))
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3).toMatchObject<Partial<typeof lastPosition3>>({
      openLevelId: '2',
      closedByRule: ClosingRule.SL,
    })

    // 4. Открываем еще одну
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition4 = selectLastPosition(store.getState())
    expect(lastPosition4).toMatchObject<Partial<typeof lastPosition4>>({
      openLevelId: '2',
      isClosed: false,
    })

    // 5. Закрываем по стопу повторно
    store.dispatch(changePrice({ ask: 1.4, bid: 1.5 }))
    const lastPosition5 = selectLastPosition(store.getState())
    expect(lastPosition5).toMatchObject<Partial<typeof lastPosition5>>({
      openLevelId: '2',
      closedByRule: ClosingRule.SL,
    })

    // 6. Тренд изменен на обратный по коррекции
    const lastTrend6 = selectLastTrend(store.getState())
    expect(lastTrend6).toMatchObject<Partial<typeof lastTrend6>>({
      direction: TrendDirection.DOWN,
      isCorrection: true,
    })
  })
})

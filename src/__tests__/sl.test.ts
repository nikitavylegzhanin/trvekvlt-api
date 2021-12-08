import store from '../store'
import { initLevels } from '../store/levels'
import { selectLastPosition, initPositions } from '../store/positions'
import { PositionClosingRule } from '../db/Position'
import { changePrice } from '../store/price'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'

describe('SL', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [1, 2, 3, 4, 5].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  beforeEach(() => {
    store.dispatch(initPositions([]))
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
    store.dispatch(initLevels(levels))
  })

  test('при достижении 50% до следующего уровня против тренда', () => {
    //      Uptrend
    // 2 -╱╲-------------- | 1
    //      ╲╱             | 2
    // 1 ----------------- |

    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // 1. Открываем позицию в лонг на уровне 2
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
    })

    // 2. Цена падает на 50% до следующего уровня против тренда → SL
    store.dispatch(changePrice({ ask: 1.4, bid: 1.5 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })
  })

  test('не открываем позиции после SL на коррекции', () => {
    // 4 -╲---------- | Long
    //     ╲          | 1 SL
    // 3 ---╲-------- | Long
    //       ╲  ╱     | 2 SL → Correction, 3 SL → do not open positions yet
    // 2 -----╲╱----- | Short

    // 1. Long → SL
    store.dispatch(changePrice({ ask: 3.9, bid: 4 }))
    store.dispatch(changePrice({ ask: 3.4, bid: 3.5 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 4,
      closedByRule: PositionClosingRule.SL,
    })

    // 2. Long → SL → Correction
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 3,
      closedByRule: PositionClosingRule.SL,
    })

    // 3. Short → SL
    store.dispatch(changePrice({ ask: 2, bid: 2.1 }))
    store.dispatch(changePrice({ ask: 2.5, bid: 2.6 }))
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 4. Do not open positions yet
    store.dispatch(changePrice({ ask: 2.9, bid: 3 })) // 2SL reverses trend
    const position4 = selectLastPosition(store.getState())
    expect(position4.openLevelId).toBe(2)
    expect(position4.closedByRule).toBe(PositionClosingRule.SL)
  })
})

import store from '../store'
import { initLevels } from '../store/levels'
import {
  selectLastPosition,
  resetPositions,
  ClosingRule,
} from '../store/positions'
import { changePrice } from '../store/price'
import { addTrend, TrendDirection } from '../store/trends'

describe('SL', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [1, 2, 3, 4, 5].map((value) => ({
    value,
    id: value.toString(),
    isDisabled: false,
  }))

  beforeEach(() => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
    store.dispatch(initLevels(levels))
  })

  test('при достижении 50% до следующего уровня против тренда', () => {
    //      Uptrend
    // 2 -╱╲-------------- | 1
    //      ╲╱             | 2
    // 1 ----------------- |

    store.dispatch(addTrend({ direction: TrendDirection.UP }))

    // 1. Открываем позицию в лонг на уровне 2
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: '2',
    })

    // 2. Цена падает на 50% до следующего уровня против тренда → SL
    store.dispatch(changePrice({ ask: 1.4, bid: 1.5 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: '2',
      isClosed: true,
      closedByRule: ClosingRule.SL,
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
      openLevelId: '4',
      closedByRule: ClosingRule.SL,
    })

    // 2. Long → SL → Correction
    store.dispatch(changePrice({ ask: 2.9, bid: 3 }))
    store.dispatch(changePrice({ ask: 2.4, bid: 2.5 }))
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: '3',
      closedByRule: ClosingRule.SL,
    })

    // 3. Short → SL
    store.dispatch(changePrice({ ask: 2, bid: 2.1 }))
    store.dispatch(changePrice({ ask: 2.5, bid: 2.6 }))
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: '2',
      closedByRule: ClosingRule.SL,
    })

    // 4. Do not open positions yet
    store.dispatch(changePrice({ ask: 2.9, bid: 3 })) // 2SL reverses trend
    const position4 = selectLastPosition(store.getState())
    expect(position4).toMatchObject<Partial<typeof position4>>({
      openLevelId: '2',
      isClosed: true,
    })
  })
})

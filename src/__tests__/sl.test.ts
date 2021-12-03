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
  const levels = [1, 2, 3, 4].map((value) => ({
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
})

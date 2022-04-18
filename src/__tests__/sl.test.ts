jest.mock('telegraf')
import store from '../store'
import { initLevels } from '../store/levels'
import { selectLastPosition, initPositions } from '../store/positions'
import { PositionClosingRule } from '../db/Position'
import { addTrend, selectLastTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { editConfig } from '../store/config'
import { runStartegy } from '../strategy'

const placeOrder = jest.fn((data) => data)

describe('SL', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [0.5, 1, 2, 3, 4, 5].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  beforeEach(() => {
    store.dispatch(initPositions([]))
    store.dispatch(initLevels(levels))
  })

  test('при достижении 50% до следующего уровня против тренда (лонг)', () => {
    //      Uptrend
    // 2 -╱╲-------------- | 1
    //      ╲╱             | 2
    // 1 ----------------- |

    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // 1. Открываем позицию в лонг на уровне 2
    runStartegy(1.9, 2, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
    })

    // 2. Цена падает на 50% до следующего уровня против тренда → SL
    runStartegy(1.4, 1.5, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })
  })

  test('при достижении 50% до следующего уровня против тренда (шорт)', () => {
    //      Downtrend
    // 3 -------- |
    //      ╱╲    | 2
    // 2 -╲╱----- | 1

    store.dispatch(
      addTrend({ direction: TrendDirection.DOWN, type: TrendType.MANUAL })
    )

    // 1. Открываем позицию в шорт на уровне 2
    runStartegy(2, 2.1, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
    })

    // 2. Цена поднимается на 50% до следующего уровня (3) против тренда → SL
    runStartegy(2.5, 2.6, placeOrder)
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

    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )

    // 1. Long → SL
    runStartegy(3.9, 4, placeOrder)
    runStartegy(3.4, 3.5, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 4,
      closedByRule: PositionClosingRule.SL,
    })

    // 2. Long → SL → Correction
    runStartegy(2.9, 3, placeOrder)
    runStartegy(2.4, 2.5, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 3,
      closedByRule: PositionClosingRule.SL,
    })

    // 3. Short → SL
    runStartegy(2, 2.1, placeOrder)
    runStartegy(2.5, 2.6, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 4. Do not open positions yet
    runStartegy(2.9, 3, placeOrder) // 2SL reverses trend
    const position4 = selectLastPosition(store.getState())
    expect(position4.openLevelId).toBe(2)
    expect(position4.closedByRule).toBe(PositionClosingRule.SL)
  })

  test('не открываем позиции после SL на коррекции (шорт)', () => {
    store.dispatch(editConfig({ isDisabled: false }))
    store.dispatch(
      initLevels(
        [20.91, 21.52, 21.7, 22.1, 22.59].map((value, id) => ({
          value,
          id: id + 1,
          isDisabled: false,
        }))
      )
    )
    store.dispatch(
      addTrend({ direction: TrendDirection.DOWN, type: TrendType.MANUAL })
    )

    // 1. Short → SL
    runStartegy(21.52, 21.53, placeOrder)
    runStartegy(21.62, 21.63, placeOrder)
    const position1 = selectLastPosition(store.getState())
    expect(position1).toMatchObject<Partial<typeof position1>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 2. Short → SL → Correction
    runStartegy(21.7, 21.71, placeOrder)
    runStartegy(21.91, 21.92, placeOrder)
    const position2 = selectLastPosition(store.getState())
    expect(position2).toMatchObject<Partial<typeof position2>>({
      openLevelId: 3,
      closedByRule: PositionClosingRule.SL,
    })

    const lastTrend1 = selectLastTrend(store.getState())
    expect(lastTrend1).toMatchObject<Partial<typeof lastTrend1>>({
      direction: TrendDirection.UP,
      type: TrendType.CORRECTION,
    })

    // 3. Long → SL
    runStartegy(22.09, 22.1, placeOrder)
    runStartegy(21.89, 21.9, placeOrder)
    const position3 = selectLastPosition(store.getState())
    expect(position3).toMatchObject<Partial<typeof position3>>({
      openLevelId: 4,
      closedByRule: PositionClosingRule.SL,
    })

    // 4. Strategy is disabled
    expect(store.getState().config.isDisabled).toBeTruthy()
  })
})

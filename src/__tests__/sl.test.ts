jest.mock('telegraf')
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import {
  TrendDirection,
  TrendType,
  PositionOpeningRule,
  PositionClosingRule,
  BotStatus,
} from '../db'
import { runStartegy } from '../strategy'
import { getTestBot, getTestLevels, getTestTrend, mockPrice } from './utils'

const testBot = getTestBot()

describe('SL', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(
      editBot({
        id: testBot.id,
        status: testBot.status,
        positions: [],
        levels: getTestLevels([0.5, 1, 2, 3, 4, 5]),
      })
    )
  })

  store.dispatch(initBots([testBot]))

  test('при достижении 50% до следующего уровня против тренда (лонг)', async () => {
    //      Uptrend
    // 2 --╲-------------- | 1
    //      ╲╱             | 2
    // 1 ----------------- |

    // 1. Открываем позицию в лонг на уровне 2 по правилам ON_LEVEL и AFTER_LEVEL_3TICKS
    await runStartegy(testBot.id, ...mockPrice(2.03))
    await runStartegy(testBot.id, ...mockPrice(2))
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(3)
    expect(position1.openedByRules).toEqual(
      expect.arrayContaining([
        PositionOpeningRule.ON_LEVEL,
        PositionOpeningRule.AFTER_LEVEL_3TICKS,
      ])
    )

    // 2. Цена падает на 50% от средней цены позиции до следующего уровня против тренда → SL
    await runStartegy(testBot.id, ...mockPrice(1.506))
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(3)
    expect(position2.closedByRule).toBe(PositionClosingRule.SL)
  })

  test('при достижении 50% до следующего уровня против тренда (шорт)', async () => {
    //      Downtrend
    // 3 -------- |
    //      ╱╲    | 2
    // 2 --╱----- | 1

    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend(true)] }))

    // 1. Открываем позицию в шорт на уровне 2 по правилам BEFORE_LEVEL и ON_LEVEL
    await runStartegy(testBot.id, ...mockPrice(1.97))
    await runStartegy(testBot.id, ...mockPrice(2))
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(3)

    // 2. Цена поднимается на 50% от средней цены позиции до следующего уровня (3) против тренда → SL
    await runStartegy(testBot.id, ...mockPrice(2.495))
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(3)
    expect(position2.closedByRule).toBe(PositionClosingRule.SL)
  })

  test('не открываем позиции после SL на коррекции', async () => {
    // 4 -╲---------- | Long
    //     ╲          | 1 SL
    // 3 ---╲-------- | Long
    //       ╲  ╱     | 2 SL → Correction, 3 SL → do not open positions yet
    // 2 -----╲╱----- | Short

    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend()] }))

    // 1. Long → SL
    await runStartegy(testBot.id, ...mockPrice(4))
    await runStartegy(testBot.id, ...mockPrice(3.5))
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(5)
    expect(position1.closedByRule).toBe(PositionClosingRule.SL)

    // 2. Long → SL → Correction
    await runStartegy(testBot.id, ...mockPrice(3))
    await runStartegy(testBot.id, ...mockPrice(2.5))
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(4)
    expect(position2.closedByRule).toBe(PositionClosingRule.SL)

    // 3. Short → SL
    await runStartegy(testBot.id, ...mockPrice(2))
    await runStartegy(testBot.id, ...mockPrice(2.5))
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(3)
    expect(position3.closedByRule).toBe(PositionClosingRule.SL)

    // 4. Do not open positions yet
    await runStartegy(testBot.id, ...mockPrice(3)) // 2SL reverses trend
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.openLevel.id).toBe(3)
    expect(position4.closedByRule).toBe(PositionClosingRule.SL)
  })

  test('не открываем позиции после SL на коррекции (шорт)', async () => {
    store.dispatch(
      editBot({
        id: testBot.id,
        levels: getTestLevels([20.91, 21.52, 21.7, 22.1, 22.59]),
        trends: [getTestTrend(true)],
      })
    )

    // 1. Short → SL
    await runStartegy(testBot.id, ...mockPrice(21.52))
    await runStartegy(testBot.id, ...mockPrice(21.62))
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.openLevel.id).toBe(2)
    expect(position1.closedByRule).toBe(PositionClosingRule.SL)

    // 2. Short → SL → Correction
    await runStartegy(testBot.id, ...mockPrice(21.7))
    await runStartegy(testBot.id, ...mockPrice(21.91))
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.openLevel.id).toBe(3)
    expect(position2.closedByRule).toBe(PositionClosingRule.SL)

    const lastTrend1 = getLastTrend(store.getState().bots[0])
    expect(lastTrend1).toMatchObject<Partial<typeof lastTrend1>>({
      direction: TrendDirection.UP,
      type: TrendType.CORRECTION,
    })

    // 3. Long → SL
    await runStartegy(testBot.id, ...mockPrice(22.1))
    await runStartegy(testBot.id, ...mockPrice(21.9))
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.openLevel.id).toBe(4)
    expect(position3.closedByRule).toBe(PositionClosingRule.SL)

    // 4. Strategy is disabled
    expect(store.getState().bots[0].status).toBe(
      BotStatus.DISABLED_DURING_SESSION
    )
  })
})

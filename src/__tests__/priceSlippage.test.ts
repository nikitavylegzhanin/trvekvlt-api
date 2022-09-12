import './mocks'
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import { runStrategy } from '../strategy'
import { PositionStatus, OrderRule, TrendDirection } from '../db'
import { getTestBot, getTestTrend } from './utils'

const testBot = getTestBot([1, 2, 3, 4, 5], false, false, 0.02)

describe('Проскакивание цены', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(
      editBot({
        id: testBot.id,
        positions: [],
        lastPrice: undefined,
      })
    )
  })

  store.dispatch(initBots([testBot]))

  test('открываем в три шага с thickValue = 0.02, закрываем по тейку', async () => {
    // 1. 2.93 skip
    await runStrategy(testBot.id, 2.93)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1).toBeUndefined()

    // 2. 2.93 → 2.95 OPEN_BEFORE_LEVEL_3TICKS (2.94)
    //  3 - 0.02 * 3 = 2.94
    //  2.95 (current) > 2.94 > 2.93 (previous)
    await runStrategy(testBot.id, 2.95)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position2.orders[0].rule).toBe(OrderRule.OPEN_BEFORE_LEVEL_3TICKS)

    // 3. 2.95 → 3 OPEN_ON_LEVEL (3)
    await runStrategy(testBot.id, 3)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position3.orders[1].rule).toBe(OrderRule.OPEN_ON_LEVEL)

    // 4. 3 → 3.05 skip
    await runStrategy(testBot.id, 3.05)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position3.orders).toHaveLength(2)

    // 5. 3.05 → 3.07 OPEN_AFTER_LEVEL_3TICKS (3.06)
    await runStrategy(testBot.id, 3.07)
    const position5 = getLastPosition(store.getState().bots[0])
    expect(position5.status).toBe(PositionStatus.OPEN_FULL)
    expect(position5.orders[2].rule).toBe(OrderRule.OPEN_AFTER_LEVEL_3TICKS)

    // 6. 3.98 → 4.01 TP (next level value = 4)
    await runStrategy(testBot.id, 3.98)
    await runStrategy(testBot.id, 4.01)
    const position6 = getLastPosition(store.getState().bots[0])
    expect(position6.status).toBe(PositionStatus.CLOSED)
    expect(position6.orders[3].rule).toBe(OrderRule.CLOSE_BY_TP)
  })

  test('открываем в шорт, закрываем по стопу', async () => {
    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend(true)] }))
    expect(store.getState().bots[0].lastPrice).toBeUndefined()
    const lastTrend = getLastTrend(store.getState().bots[0])
    expect(lastTrend.direction).toBe(TrendDirection.DOWN)

    // 1. 3.01 → 2.9 OPEN_ON_LEVEL (3)
    await runStrategy(testBot.id, 3.01)
    expect(getLastPosition(store.getState().bots[0])).toBeUndefined()

    await runStrategy(testBot.id, 2.9)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position1.orders[0].rule).toBe(OrderRule.OPEN_ON_LEVEL)

    // 2. 2.91 → 2.94 OPEN_AFTER_LEVEL_3TICKS (2.94)
    await runStrategy(testBot.id, 2.91)
    expect(getLastPosition(store.getState().bots[0]).orders).toHaveLength(1)

    await runStrategy(testBot.id, 2.94)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.orders[1].rule).toBe(OrderRule.OPEN_AFTER_LEVEL_3TICKS)

    // 3. 3.01 → 3.3 OPEN_BEFORE_LEVEL_3TICKS (3.06)
    await runStrategy(testBot.id, 3.01)
    expect(getLastPosition(store.getState().bots[0]).orders).toHaveLength(2)

    await runStrategy(testBot.id, 3.3)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.status).toBe(PositionStatus.OPEN_FULL)
    expect(position3.orders).toHaveLength(3)
    expect(position3.orders[2].rule).toBe(OrderRule.OPEN_BEFORE_LEVEL_3TICKS)

    // 4. 3.53 SL
    await runStrategy(testBot.id, 3.53)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.status).toBe(PositionStatus.CLOSED)
  })
})

import './mocks'
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition } from '../strategy/utils'
import { runStrategy } from '../strategy'
import { PositionStatus, OrderRule } from '../db'
import { getTestBot } from './utils'

const testBot = getTestBot([1, 2, 3, 4, 5], false, false, 0.02)

describe('Открытие позиции с использованием параметра tickValue', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  beforeEach(() => {
    store.dispatch(
      editBot({
        id: testBot.id,
        positions: [],
      })
    )
  })

  store.dispatch(initBots([testBot]))

  test('в три шага', async () => {
    // 1. 2.93 skip
    await runStrategy(testBot.id, 2.93)
    const position1 = getLastPosition(store.getState().bots[0])
    expect(position1).toBeUndefined()

    // 2. 2.94 OPEN_BEFORE_LEVEL_3TICKS (3 - 0.02 * 3)
    await runStrategy(testBot.id, 2.94)
    const position2 = getLastPosition(store.getState().bots[0])
    expect(position2.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position2.orders[0].rule).toBe(OrderRule.OPEN_BEFORE_LEVEL_3TICKS)

    // 3. 3 OPEN_ON_LEVEL
    await runStrategy(testBot.id, 3)
    const position3 = getLastPosition(store.getState().bots[0])
    expect(position3.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position3.orders[1].rule).toBe(OrderRule.OPEN_ON_LEVEL)

    // 4. 3.05 skip
    await runStrategy(testBot.id, 3.05)
    const position4 = getLastPosition(store.getState().bots[0])
    expect(position4.status).toBe(PositionStatus.OPEN_PARTIAL)
    expect(position3.orders).toHaveLength(2)

    // 5. 3.06 OPEN_AFTER_LEVEL_3TICKS
    await runStrategy(testBot.id, 3.06)
    const position5 = getLastPosition(store.getState().bots[0])
    expect(position5.status).toBe(PositionStatus.OPEN_FULL)
    expect(position5.orders[2].rule).toBe(OrderRule.OPEN_AFTER_LEVEL_3TICKS)
  })
})

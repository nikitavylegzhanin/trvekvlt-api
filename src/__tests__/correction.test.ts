jest.mock('telegraf')
import store from '../store'
import { initBots } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import { runStartegy } from '../strategy'
import { TrendDirection, TrendType } from '../db/Trend'
import { PositionClosingRule } from '../db/Position'
import { getTestBot } from './utils'

const placeOrder = jest.fn((data) => data)
const testBot = getTestBot([0.5, 1, 2, 3])

describe('Correction', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  store.dispatch(initBots([testBot]))

  it('меняет направление тренда при 2 SL подряд', async () => {
    // 1. Аптренд
    const lastTrend1 = getLastTrend(store.getState().bots[0])
    expect(lastTrend1.direction).toBe(TrendDirection.UP)

    // 2. Открываем позицию
    await runStartegy(testBot.id, 2, placeOrder)
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition2.openLevel.id).toBe(3)
    expect(lastPosition2.closedByRule).toBeUndefined()

    // 3. Закрываем по стопу
    await runStartegy(testBot.id, 1.49, placeOrder)
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3.openLevel.id).toBe(3)
    expect(lastPosition3.closedByRule).toBe(PositionClosingRule.SL)

    // 4. Открываем еще одну
    await runStartegy(testBot.id, 2, placeOrder)
    const lastPosition4 = getLastPosition(store.getState().bots[0])
    expect(lastPosition4.openLevel.id).toBe(3)
    expect(lastPosition4.closedByRule).toBeUndefined()

    // 5. Закрываем по стопу повторно
    await runStartegy(testBot.id, 1.5, placeOrder)
    const lastPosition5 = getLastPosition(store.getState().bots[0])
    expect(lastPosition5.openLevel.id).toBe(3)
    expect(lastPosition5.closedByRule).toBe(PositionClosingRule.SL)

    // 6. Тренд изменен на обратный по коррекции
    const lastTrend6 = getLastTrend(store.getState().bots[0])
    expect(lastTrend6).toMatchObject<Partial<typeof lastTrend6>>({
      direction: TrendDirection.DOWN,
      type: TrendType.CORRECTION,
    })
  })
})

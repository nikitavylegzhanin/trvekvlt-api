jest.mock('telegraf')
import store from '../store'
import { initBots } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import { runStartegy } from '../strategy'
import { TrendDirection, TrendType } from '../db/Trend'
import { OrderRule, PositionStatus } from '../db'
import { getTestBot, mockPrice } from './utils'

const testBot = getTestBot([0.5, 1, 2, 3])

describe('Correction', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  store.dispatch(initBots([testBot]))

  it('меняет направление тренда при 2 SL подряд', async () => {
    // 1. Аптренд
    const lastTrend1 = getLastTrend(store.getState().bots[0])
    expect(lastTrend1.direction).toBe(TrendDirection.UP)

    // 2. Открываем позицию
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition2.openLevel.id).toBe(3)
    expect(lastPosition2.status).toBe(PositionStatus.OPEN_PARTIAL)

    // 3. Закрываем по стопу
    await runStartegy(testBot.id, ...mockPrice(1.49))
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3.openLevel.id).toBe(3)
    expect(lastPosition3.status).toBe(PositionStatus.CLOSED)
    expect(lastPosition3.orders[1].rule).toBe(OrderRule.CLOSE_BY_SL)

    // 4. Открываем еще одну
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition4 = getLastPosition(store.getState().bots[0])
    expect(lastPosition4.openLevel.id).toBe(3)
    expect(lastPosition4.status).toBe(PositionStatus.OPEN_PARTIAL)

    // 5. Закрываем по стопу повторно
    await runStartegy(testBot.id, ...mockPrice(1.5))
    const lastPosition5 = getLastPosition(store.getState().bots[0])
    expect(lastPosition5.status).toBe(PositionStatus.CLOSED)
    expect(lastPosition5.orders[1].rule).toBe(OrderRule.CLOSE_BY_SL)

    // 6. Тренд изменен на обратный по коррекции
    const lastTrend6 = getLastTrend(store.getState().bots[0])
    expect(lastTrend6).toMatchObject<Partial<typeof lastTrend6>>({
      direction: TrendDirection.DOWN,
      type: TrendType.CORRECTION,
    })
  })
})

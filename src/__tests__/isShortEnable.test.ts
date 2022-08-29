import './mocks'
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import { TrendDirection, TrendType, PositionStatus, OrderRule } from '../db'
import { runStrategy } from '../strategy'
import { getTestBot, getTestTrend } from './utils'

const testBot = getTestBot([1, 2, 3, 4, 5], true)

describe('Short enable flag', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  store.dispatch(initBots([{ ...testBot, isShortEnable: false }]))

  it('торгует только в лонг при недоступном шорте', async () => {
    const trend1 = getLastTrend(store.getState().bots[0])
    expect(trend1.direction).toBe(TrendDirection.DOWN)
    expect(store.getState().bots[0].isShortEnable).toBeFalsy()

    // 1. пропускает торговлю в шорт при даунтренде
    await runStrategy(testBot.id, 4)
    const lastPosition1 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1).toBeUndefined()

    // 2. открывает при аптренде → SL x2 → CORRECTION
    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend()] }))
    const trend2 = getLastTrend(store.getState().bots[0])
    expect(trend2.direction).toBe(TrendDirection.UP)
    expect(store.getState().bots[0].isShortEnable).toBeFalsy()

    await runStrategy(testBot.id, 4)
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition2.openLevel.id).toBe(4)

    await runStrategy(testBot.id, 3.49)
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3.status).toBe(PositionStatus.CLOSED)
    expect(lastPosition3.orders[1].rule).toBe(OrderRule.CLOSE_BY_SL)

    await runStrategy(testBot.id, 3)
    const lastPosition4 = getLastPosition(store.getState().bots[0])
    expect(lastPosition4.openLevel.id).toBe(3)

    await runStrategy(testBot.id, 2.49)
    const lastPosition5 = getLastPosition(store.getState().bots[0])
    expect(lastPosition5.status).toBe(PositionStatus.CLOSED)
    expect(lastPosition5.orders[1].rule).toBe(OrderRule.CLOSE_BY_SL)

    const trend3 = getLastTrend(store.getState().bots[0])
    expect(trend3.direction).toBe(TrendDirection.DOWN)
    expect(trend3.type).toBe(TrendType.CORRECTION)

    // 3. пропускает шорт на коррекции
    await runStrategy(testBot.id, 2)
    const { positions } = store.getState().bots[0]
    expect(positions).toHaveLength(2)
  })
})

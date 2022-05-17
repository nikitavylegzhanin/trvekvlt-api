jest.mock('telegraf')
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition, getLastTrend } from '../strategy/utils'
import { TrendDirection, TrendType, PositionClosingRule } from '../db'
import { runStartegy } from '../strategy'
import { getTestBot, getTestTrend } from './utils'

const placeOrder = jest.fn((data) => data)
const testBot = getTestBot([1, 2, 3, 4, 5], true)

describe('Short enable flag', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  store.dispatch(initBots([{ ...testBot, isShortEnable: false }]))

  it('торгует только в лонг при недоступном шорте', async () => {
    const trend1 = getLastTrend(store.getState().bots[0])
    expect(trend1.direction).toBe(TrendDirection.DOWN)
    expect(store.getState().bots[0].isShortEnable).toBeFalsy()

    // 1. пропускает торговлю в шорт при даунтренде
    await runStartegy(testBot.id, 4, placeOrder)
    const lastPosition1 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1).toBeUndefined()

    // 2. открывает при аптренде → SL x2 → CORRECTION
    store.dispatch(editBot({ id: testBot.id, trends: [getTestTrend()] }))
    const trend2 = getLastTrend(store.getState().bots[0])
    expect(trend2.direction).toBe(TrendDirection.UP)
    expect(store.getState().bots[0].isShortEnable).toBeFalsy()

    await runStartegy(testBot.id, 4, placeOrder)
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition2.openLevel.id).toBe(4)

    await runStartegy(testBot.id, 3.49, placeOrder)
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3.closedByRule).toBe(PositionClosingRule.SL)

    await runStartegy(testBot.id, 3, placeOrder)
    const lastPosition4 = getLastPosition(store.getState().bots[0])
    expect(lastPosition4.openLevel.id).toBe(3)

    await runStartegy(testBot.id, 2.49, placeOrder)
    const lastPosition5 = getLastPosition(store.getState().bots[0])
    expect(lastPosition5.closedByRule).toBe(PositionClosingRule.SL)

    const trend3 = getLastTrend(store.getState().bots[0])
    expect(trend3.direction).toBe(TrendDirection.DOWN)
    expect(trend3.type).toBe(TrendType.CORRECTION)

    // 3. пропускает шорт на коррекции
    await runStartegy(testBot.id, 2, placeOrder)
    const { positions } = store.getState().bots[0]
    expect(positions).toHaveLength(2)
  })
})

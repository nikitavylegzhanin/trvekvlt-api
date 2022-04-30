jest.mock('telegraf')
import store from '../store'
import { addLevels } from '../store/levels'
import { addTrend, selectLastTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { selectLastPosition } from '../store/positions'
import { editConfig } from '../store/config'
import { PositionClosingRule } from '../db/Position'
import { runStartegy } from '../strategy'

const placeOrder = jest.fn((data) => data)

describe('Correction', () => {
  jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18).getTime())

  const levels = [0.5, 1, 2, 3].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  store.dispatch(addLevels(levels))
  store.dispatch(
    editConfig({
      startDate: new Date(2021, 11, 31, 10, 0, 0),
      endDate: new Date(2021, 11, 31, 18, 40, 0),
    })
  )

  it('меняет направление тренда при 2 SL подряд', async () => {
    // 1. Аптренд
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
    )
    const lastTrend1 = selectLastTrend(store.getState())
    expect(lastTrend1).toMatchObject<Partial<typeof lastTrend1>>({
      direction: TrendDirection.UP,
    })

    // 2. Открываем позицию
    await runStartegy(2, placeOrder)
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2.openLevelId).toBe(2)
    expect(lastPosition2.closedByRule).toBeUndefined()

    // 3. Закрываем по стопу
    await runStartegy(1.49, placeOrder)
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3).toMatchObject<Partial<typeof lastPosition3>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 4. Открываем еще одну
    await runStartegy(2, placeOrder)
    const lastPosition4 = selectLastPosition(store.getState())
    expect(lastPosition4.openLevelId).toBe(2)
    expect(lastPosition4.closedByRule).toBeUndefined()

    // 5. Закрываем по стопу повторно
    await runStartegy(1.5, placeOrder)
    const lastPosition5 = selectLastPosition(store.getState())
    expect(lastPosition5).toMatchObject<Partial<typeof lastPosition5>>({
      openLevelId: 2,
      closedByRule: PositionClosingRule.SL,
    })

    // 6. Тренд изменен на обратный по коррекции
    const lastTrend6 = selectLastTrend(store.getState())
    expect(lastTrend6).toMatchObject<Partial<typeof lastTrend6>>({
      direction: TrendDirection.DOWN,
      type: TrendType.CORRECTION,
    })
  })
})

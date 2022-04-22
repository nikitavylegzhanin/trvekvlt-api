jest.mock('telegraf')
import store from '../store'
import { initLevels } from '../store/levels'
import { initPositions } from '../store/positions'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
import { PositionClosingRule, PositionStatus } from '../db/Position'
import { selectLastPosition, selectPositions } from '../store/positions'
import { runStartegy } from '../strategy'

const placeOrder = jest.fn((data) => data)

describe('Date intervals', () => {
  const levels = [1, 2, 3, 4, 5].map((value) => ({
    value,
    id: value,
    isDisabled: false,
  }))

  const resetData = () => {
    store.dispatch(initPositions([]))
    store.dispatch(initLevels(levels))
  }

  beforeEach(resetData)

  store.dispatch(
    addTrend({ direction: TrendDirection.UP, type: TrendType.MANUAL })
  )

  test('обрабатывает торговую логику только в интервале рыночной фазы', () => {
    // 1. Пре-опен → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 10, 29).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1).toBeUndefined()

    // 2. Основная сессия c 10:30:01 до 18:09:59 UTC+3 → работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 10, 31).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2.openLevelId).toBe(2)

    // Reset data
    resetData()

    // 3. Пост-маркет → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18, 10).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3).toBeUndefined()
  })

  test('пропускаем торговую логику во время клиринга (13:55-14:05)', () => {
    // 1. Открываем позицию до клиринга
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 13).getTime())
    runStartegy(1.99, 2, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1.openLevelId).toBe(2)
    expect(lastPosition1.status).toBe(PositionStatus.OPEN_PARTIAL)

    // 2. Во время клиринга не торгуем
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 13, 55).getTime())
    runStartegy(2.99, 3, placeOrder)
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2.openLevelId).toBe(2)
    expect(lastPosition2.status).toBe(PositionStatus.OPEN_PARTIAL)

    // 3. После клиринга закрываем
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 14, 6).getTime())
    runStartegy(2.99, 3, placeOrder)
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3.openLevelId).toBe(2)
    expect(lastPosition3.status).toBe(PositionStatus.CLOSED)
    expect(lastPosition3.closedByRule).toBe(PositionClosingRule.TP)
  })

  test('закрывает позицию и обнуляет историю по окончании рыночной фазы', () => {
    // 1. Открываем позицию
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 16, 50).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1.openLevelId).toBe(2)
    const positions1 = selectPositions(store.getState())
    expect(positions1).toHaveLength(1)

    // 2. По окончании рыночной фазы закрываем и обнуляем позиции
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18, 10).getTime())
    runStartegy(2, 2.1, placeOrder)
    const positions2 = selectPositions(store.getState())
    expect(positions2).toHaveLength(0)
  })

  // test('сбрасывает ограничения по окончании рыночной фазы', () => {
  //   // 1. Дисейблим во время ос
  //   jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
  //   store.dispatch(editConfig({ isDisabled: true }))
  //   const config1 = selectConfig(store.getState())
  //   expect(config1.isDisabled).toBeTruthy()
  //
  //   // Market closed
  //   jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 23, 10).getTime())
  //   runStartegy(2.3, 2.4)
  //
  //   // 2. На следующий день - включен
  //   jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
  //   runStartegy(2.2, 2.3)
  //   const config2 = selectConfig(store.getState())
  //   expect(config2.isDisabled).toBeFalsy()
  // })
})

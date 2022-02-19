import store from '../store'
import { initLevels } from '../store/levels'
import { initPositions } from '../store/positions'
import { addTrend } from '../store/trends'
import { TrendDirection, TrendType } from '../db/Trend'
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
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 49).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1).toBeUndefined()

    // 2. Основная сессия c 17:50 до 23:00 UTC+3 → работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2.openLevelId).toBe(2)

    // Reset data
    resetData()

    // 3. Пост-маркет → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 23, 1).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3).toBeUndefined()
  })

  test('закрывает позицию и обнуляет историю по окончании рыночной фазы', () => {
    // 1. Открываем позицию
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
    runStartegy(1.9, 2, placeOrder)
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1.openLevelId).toBe(2)
    const positions1 = selectPositions(store.getState())
    expect(positions1).toHaveLength(1)

    // 2. По окончании рыночной фазы закрываем и обнуляем позиции
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 23).getTime())
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
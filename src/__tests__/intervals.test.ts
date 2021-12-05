import store from '../store'
import { initLevels } from '../store/levels'
import { resetPositions } from '../store/positions'
import { changePrice } from '../store/price'
import { addTrend, TrendDirection } from '../store/trends'
import { selectLastPosition, selectPositions } from '../store/positions'
import { editConfig, selectConfig } from '../store/config'

describe('Intervals', () => {
  const levels = [1, 2, 3, 4, 5].map((value) => ({
    value,
    id: value.toString(),
    isDisabled: false,
  }))

  const resetData = () => {
    store.dispatch(resetPositions())
    store.dispatch(changePrice({ ask: 0, bid: 0 }))
    store.dispatch(initLevels(levels))
  }

  beforeEach(resetData)

  store.dispatch(
    addTrend({ direction: TrendDirection.UP, isCorrection: false })
  )

  test('обрабатывает торговую логику только в интервале рыночной фазы', () => {
    // 1. Пре-опен → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 49).getTime())
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1).toBeUndefined()

    // 2. Основная сессия c 17:50 до 23:00 UTC+3 → работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition2 = selectLastPosition(store.getState())
    expect(lastPosition2).toMatchObject<Partial<typeof lastPosition2>>({
      openLevelId: '2',
    })

    // Reset data
    resetData()

    // 3. Пост-маркет → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 23, 1).getTime())
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition3 = selectLastPosition(store.getState())
    expect(lastPosition3).toBeUndefined()
  })

  test('закрывает позицию и обнуляет историю по окончании рыночной фазы', () => {
    // 1. Открываем позицию
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
    store.dispatch(changePrice({ ask: 1.9, bid: 2 }))
    const lastPosition1 = selectLastPosition(store.getState())
    expect(lastPosition1).toMatchObject<Partial<typeof lastPosition1>>({
      openLevelId: '2',
    })
    const positions1 = selectPositions(store.getState())
    expect(positions1).toHaveLength(1)

    // 2. По окончании рыночной фазы закрываем и обнуляем позиции
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 23).getTime())
    store.dispatch(changePrice({ ask: 2, bid: 2.1 }))
    const positions2 = selectPositions(store.getState())
    expect(positions2).toHaveLength(0)
  })

  test('сбрасывает ограничения по окончании рыночной фазы', () => {
    // 1. Дисейблим во время ос
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
    store.dispatch(editConfig({ isDisabled: true }))
    const config1 = selectConfig(store.getState())
    expect(config1).toMatchObject<Partial<typeof config1>>({ isDisabled: true })

    // Market closed
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 23, 10).getTime())
    store.dispatch(changePrice({ ask: 2.3, bid: 2.4 }))

    // 2. На следующий день - включен
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 17, 50).getTime())
    changePrice({ ask: 2.2, bid: 2.3 })
    const config2 = selectConfig(store.getState())
    expect(config2).toMatchObject<Partial<typeof config2>>({
      isDisabled: false,
    })
  })
})

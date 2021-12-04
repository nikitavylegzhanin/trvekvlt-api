import store from '../store'
import { initLevels } from '../store/levels'
import { resetPositions } from '../store/positions'
import { changePrice } from '../store/price'
import { addTrend, TrendDirection } from '../store/trends'
import { selectLastPosition } from '../store/positions'

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

  test('обрабатывает торговую логику только в интервале рыночной фазы', () => {
    store.dispatch(
      addTrend({ direction: TrendDirection.UP, isCorrection: false })
    )

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
})

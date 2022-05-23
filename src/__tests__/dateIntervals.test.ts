jest.mock('telegraf')
import store from '../store'
import { initBots, editBot } from '../store/bots'
import { getLastPosition } from '../strategy/utils'
import { runStartegy } from '../strategy'
import { getTestBot, getTestLevels, mockPrice } from './utils'

const testBot = getTestBot()

describe('Date intervals', () => {
  const resetData = () => {
    store.dispatch(
      editBot({
        id: testBot.id,
        positions: [],
        levels: getTestLevels([1, 2, 3, 4, 5]),
        startDate: new Date(2021, 11, 31, 10, 0, 0),
        endDate: new Date(2021, 11, 31, 18, 40, 0),
      })
    )
  }

  beforeEach(resetData)

  store.dispatch(initBots([testBot]))

  test('обрабатывает торговую логику только в интервале рыночной фазы', async () => {
    // 1. Пре-опен → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 10, 29).getTime())
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition1 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1).toBeUndefined()

    // 2. Основная сессия c 10:30:01 до 18:09:59 UTC+3 → работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 10, 31).getTime())
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition2 = getLastPosition(store.getState().bots[0])
    expect(lastPosition2.openLevel.id).toBe(2)

    // Reset data
    resetData()

    // 3. Пост-маркет → не работает
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 18, 41).getTime())
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition3 = getLastPosition(store.getState().bots[0])
    expect(lastPosition3).toBeUndefined()
  })

  // test('пропускаем торговую логику во время клиринга (13:55-14:05)', () => {
  //   // 1. Открываем позицию до клиринга
  //   jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 13).getTime())
  //   runStartegy(1.99, 2))
  //   const lastPosition1 = getLastPosition(store.getState().bots[0])
  //   expect(lastPosition1.openLevelId).toBe(2)
  //   expect(lastPosition1.status).toBe(PositionStatus.OPEN_PARTIAL)
  //
  //   // 2. Во время клиринга не торгуем
  //   jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 13, 55).getTime())
  //   runStartegy(2.99, 3))
  //   const lastPosition2 = getLastPosition(store.getState().bots[0])
  //   expect(lastPosition2.openLevelId).toBe(2)
  //   expect(lastPosition2.status).toBe(PositionStatus.OPEN_PARTIAL)
  //
  //   // 3. После клиринга закрываем
  //   jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 14, 6).getTime())
  //   runStartegy(2.99, 3))
  //   const lastPosition3 = getLastPosition(store.getState().bots[0])
  //   expect(lastPosition3.openLevelId).toBe(2)
  //   expect(lastPosition3.status).toBe(PositionStatus.CLOSED)
  //   expect(lastPosition3.closedByRule).toBe(PositionClosingRule.TP)
  // })

  test('закрывает позицию и обнуляет историю по окончании рыночной фазы', async () => {
    // 1. Открываем позицию
    jest.useFakeTimers().setSystemTime(new Date(2021, 11, 31, 16, 50).getTime())
    await runStartegy(testBot.id, ...mockPrice(2))
    const lastPosition1 = getLastPosition(store.getState().bots[0])
    expect(lastPosition1.openLevel.id).toBe(2)
    const { positions: positions1 } = store.getState().bots[0]
    expect(positions1).toHaveLength(1)

    // 2. По окончании рыночной фазы закрываем и обнуляем позиции
    jest
      .useFakeTimers()
      .setSystemTime(new Date(2021, 11, 31, 18, 40, 1).getTime())
    await runStartegy(testBot.id, ...mockPrice(2))
    const { positions: positions2 } = store.getState().bots[0]
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

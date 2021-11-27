import store, { getPrice } from '../store'
import { initApp, subscribePrice } from '../app'

jest.mock('@tinkoff/invest-openapi-js-sdk', () =>
  jest.fn().mockImplementation(() => ({
    orderbook: jest.fn((_, callback) =>
      callback({
        asks: [
          [1, 1],
          [0.9, 1],
        ],
        bids: [
          [2, 1],
          [2.1, 1],
        ],
      })
    ),
    searchOne: jest.fn(() => ({ figi: 'TEST' })),
  }))
)

describe('Подписка на цены', () => {
  it('сохраняет вверхние значения ask и bid при изменении', async () => {
    const api = await initApp()

    const priceA = getPrice(store.getState())
    expect(priceA).toMatchObject<typeof priceA>({ ask: 0, bid: 0 })

    subscribePrice(api)

    const priceB = getPrice(store.getState())
    expect(priceB).toMatchObject<typeof priceB>({ ask: 1, bid: 2 })
  })
})

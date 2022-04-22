import { OpenAPIClient } from '@tinkoff/invest-js'

const api = new OpenAPIClient({
  token: process.env.API_TOKEN_SANDBOX,
})

type Instrument = {
  figi: string
}

type InstrumentType = 'future' | 'share'

export const getInstrument = (ticker: string, type: InstrumentType) =>
  new Promise<Instrument>((resolve, reject) =>
    api.instruments[type === 'future' ? 'futures' : ('shares' as 'futures')](
      {},
      (error, res) => {
        if (error) return reject(error)

        return resolve(
          res.instruments.find((future) => future.ticker === ticker)
        )
      }
    )
  )

export const marketDataStream = api.marketDataStream.marketDataStream()

export const getSandboxAccountId = () =>
  new Promise<string>((resolve, reject) =>
    api.sandbox.getSandboxAccounts({}, (error, { accounts }) => {
      if (error) return reject(error)

      const [account] = accounts

      if (account) return resolve(account.id)

      api.sandbox.openSandboxAccount({}, (error, { accountId }) => {
        if (error) return reject(error)

        return resolve(accountId)
      })
    })
  )

type MoneyValue = {
  currency: string
  units: string
  nano: number
}

const parsePrice = (value: MoneyValue) =>
  Number.parseFloat(
    (parseInt(value.units) + value.nano / 1000000000).toFixed(2)
  )

export type Order = {
  date: Date
  price: number
  currency: string
  quantity: number
  direction: string
  orderType: string
}

/**
 * @param direction 1 (ORDER_DIRECTION_BUY), 2 (ORDER_DIRECTION_SELL)
 * @param orderType 1 (ORDER_TYPE_LIMIT), 2 (ORDER_TYPE_MARKET)
 */
export const placeOrder = (
  figi: string,
  quantity: number,
  direction: 1 | 2,
  accountId: string,
  orderType: 1 | 2 = 2
) =>
  new Promise<Order>((resolve, reject) =>
    api.sandbox.postSandboxOrder(
      { figi, quantity, direction, accountId, orderType },
      (error, res) => {
        if (error) return reject(error)

        return resolve({
          date: new Date(),
          price: parsePrice(res.totalOrderAmount),
          currency: res.totalOrderAmount.currency,
          quantity,
          direction: res.direction,
          orderType: res.orderType,
        })
      }
    )
  )

export const getOrderState = (accountId: string, orderId: string) =>
  new Promise<Order>((resolve, reject) =>
    api.sandbox.getSandboxOrderState({ accountId, orderId }, (error, res) => {
      if (error) return reject(error)

      return resolve({
        date: new Date(),
        price: parsePrice(res.totalOrderAmount),
        currency: res.totalOrderAmount.currency,
        quantity: Number.parseInt(res.lotsExecuted),
        direction: res.direction,
        orderType: res.orderType,
      })
    })
  )

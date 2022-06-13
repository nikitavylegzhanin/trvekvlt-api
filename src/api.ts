import { OpenAPIClient } from '@tinkoff/invest-js'

import { Order, OrderDirection, OrderType } from './db'

const api = new OpenAPIClient({
  token: process.env.API_TOKEN_SANDBOX,
})

type Instrument = {
  figi: string
  exchange: string
  isShortEnable: boolean
  isTradeAvailable: boolean
}

type InstrumentType = 'future' | 'share'

export const getInstrument = (ticker: string, type: InstrumentType) =>
  new Promise<Instrument>((resolve, reject) =>
    api.instruments[type === 'future' ? 'futures' : ('shares' as 'futures')](
      {},
      (error, res) => {
        if (error) return reject(error)

        const instrument = res.instruments.find(
          (instrument) => instrument.ticker === ticker
        )

        if (!instrument) return reject(new Error('Instrument not found'))

        return resolve({
          figi: instrument.figi,
          exchange: instrument.exchange,
          isShortEnable: instrument.shortEnabledFlag,
          isTradeAvailable: instrument.apiTradeAvailableFlag,
        })
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
  currency?: string
  units: string
  nano: number
}

const parsePrice = (value: MoneyValue) =>
  Number.parseFloat(
    (parseInt(value.units) + value.nano / 1000000000).toFixed(2)
  )

export type PlacedOrder = {
  price: Order['price']
  currency: Order['currency']
  quantity: Order['quantity']
  direction: Order['direction']
  type: Order['type']
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
  new Promise<PlacedOrder>((resolve, reject) =>
    api.sandbox.postSandboxOrder(
      { figi, quantity, direction, accountId, orderType },
      (error, res) => {
        if (error) return reject(error)

        return resolve({
          price: parsePrice(res.totalOrderAmount),
          currency: res.totalOrderAmount.currency,
          quantity,
          direction:
            res.direction === 'ORDER_DIRECTION_BUY'
              ? OrderDirection.BUY
              : OrderDirection.SELL,
          type:
            res.orderType === 'ORDER_TYPE_LIMIT'
              ? OrderType.LIMIT
              : OrderType.MARKET,
        })
      }
    )
  )

export const getOrderState = (accountId: string, orderId: string) =>
  new Promise<PlacedOrder>((resolve, reject) =>
    api.sandbox.getSandboxOrderState({ accountId, orderId }, (error, res) => {
      if (error) return reject(error)

      return resolve({
        price: parsePrice(res.totalOrderAmount),
        currency: res.totalOrderAmount.currency,
        quantity: Number.parseInt(res.lotsExecuted),
        direction:
          res.direction === 'ORDER_DIRECTION_BUY'
            ? OrderDirection.BUY
            : OrderDirection.SELL,
        type:
          res.orderType === 'ORDER_TYPE_LIMIT'
            ? OrderType.LIMIT
            : OrderType.MARKET,
      })
    })
  )

const parseDateToRequest = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanos: (date.getTime() % 1000) * 1e6,
})

type Timestamp = {
  seconds: string
  nanos: number
}

const parseDateToResponse = (timestamp?: Timestamp) =>
  timestamp ? new Date(Number.parseInt(timestamp.seconds) * 1000) : null

type TradingSchedule = {
  isTradingDay: boolean
  startDate: Date
  endDate: Date
  premarketStartDate: Date
  premarketEndDate: Date
}

export const getTradingSchedule = (exchange: string, from: Date, to?: Date) =>
  new Promise<TradingSchedule>((resolve, reject) => {
    api.instruments.tradingSchedules(
      {
        exchange,
        from: parseDateToRequest(from),
        to: parseDateToRequest(to || from),
      },
      (error, res) => {
        if (error) return reject(error)

        const [day] = res.exchanges[0].days

        return resolve({
          isTradingDay: day.isTradingDay,
          startDate: parseDateToResponse(day.startTime),
          endDate: parseDateToResponse(day.endTime),
          premarketStartDate: parseDateToResponse(day.premarketStartTime),
          premarketEndDate: parseDateToResponse(day.premarketEndTime),
        })
      }
    )
  })

type Candle = {
  date: Date
  low: number
  open: number
  close: number
  high: number
  volume: number
}

/**
 * @param interval 1 (CANDLE_INTERVAL_1_MIN), 2 (5_MIN), 3 (15_MIN), 4 (HOUR), 5 (DAY)
 */
export const getCandles = (figi: string, from: Date, to: Date, interval = 4) =>
  new Promise<Candle[]>((resolve, reject) => {
    api.marketData.getCandles(
      {
        figi,
        from: parseDateToRequest(from),
        to: parseDateToRequest(to),
        interval,
      },
      (error, res) => {
        if (error) return reject(error)

        return resolve(
          res.candles.map((candle) => ({
            date: parseDateToResponse(candle.time),
            low: parsePrice(candle.low),
            open: parsePrice(candle.open),
            close: parsePrice(candle.close),
            high: parsePrice(candle.high),
            volume: parseInt(candle.volume),
          }))
        )
      }
    )
  })

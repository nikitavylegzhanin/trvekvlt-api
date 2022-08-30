import { OpenAPIClient } from '@tinkoff/invest-js'
import {
  Quotation,
  Quotation__Output,
} from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Quotation'
import { Share } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Share'

import { Order, OrderDirection, OrderType } from './db'

const api = new OpenAPIClient({
  token: process.env.API_TOKEN,
})

const sandboxApi = new OpenAPIClient({
  token: process.env.API_TOKEN_SANDBOX,
})

export const parsePrice = (value: Quotation__Output) =>
  Number.parseFloat(
    (parseInt(value.units) + value.nano / NANO_DIVIDER).toFixed(2)
  )

type Instrument = {
  figi: string
  ticker: string
  name: string
  exchange: string
  isShortEnable: boolean
  isTradeAvailable: boolean
  tickValue: number
}

type InstrumentType = 'future' | 'share'

export const getInstrument = (ticker: string, type: InstrumentType) =>
  new Promise<Instrument>((resolve, reject) =>
    sandboxApi.instruments[
      type === 'future' ? 'futures' : ('shares' as 'futures')
    ]({}, (error, res) => {
      if (error) return reject(error)

      const instrument = res.instruments.find(
        (instrument) => instrument.ticker === ticker
      )

      if (!instrument) return reject(new Error('Instrument not found'))

      return resolve({
        figi: instrument.figi,
        ticker: instrument.ticker,
        name: instrument.name,
        exchange: instrument.exchange,
        isShortEnable: instrument.shortEnabledFlag,
        isTradeAvailable: instrument.apiTradeAvailableFlag,
        tickValue: parsePrice(instrument.minPriceIncrement),
      })
    })
  )

export const getInstrumentByFigi = (figi: string) =>
  new Promise<Instrument>((resolve, reject) =>
    sandboxApi.instruments.getInstrumentBy(
      { idType: 'INSTRUMENT_ID_TYPE_FIGI', id: figi },
      (err, res) => {
        if (err) return reject(err)

        const { instrument } = res
        return resolve({
          figi: instrument.figi,
          ticker: instrument.ticker,
          name: instrument.name,
          exchange: instrument.exchange,
          isShortEnable: instrument.shortEnabledFlag,
          isTradeAvailable: instrument.apiTradeAvailableFlag,
          tickValue: parsePrice(instrument.minPriceIncrement),
        })
      }
    )
  )

export const marketDataStream = sandboxApi.marketDataStream.marketDataStream()

export const unsubscribeFromOrderBook = (figi: Share['figi']) =>
  marketDataStream.write({
    subscribeOrderBookRequest: {
      instruments: [{ figi }],
      subscriptionAction: 'SUBSCRIPTION_ACTION_UNSUBSCRIBE',
    },
  })

export const getSandboxAccountId = () =>
  new Promise<string>((resolve, reject) =>
    sandboxApi.sandbox.getSandboxAccounts({}, (error, { accounts }) => {
      if (error) return reject(error)

      const [account] = accounts

      if (account) return resolve(account.id)

      sandboxApi.sandbox.openSandboxAccount({}, (error, { accountId }) => {
        if (error) return reject(error)

        return resolve(accountId)
      })
    })
  )

const NANO_DIVIDER = 1000000000

export const numberToQuotation = (value: number): Quotation => {
  const units = Math.floor(value)
  const nano = Math.floor((value - units) * NANO_DIVIDER)

  return {
    units,
    nano,
  }
}

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
  price: number,
  orderType: 1 | 2 = 2
) =>
  new Promise<PlacedOrder>((resolve, reject) =>
    sandboxApi.sandbox.postSandboxOrder(
      {
        figi,
        quantity,
        direction,
        accountId,
        orderType,
        price: numberToQuotation(price),
      },
      (error, res) => {
        if (error) return reject(error)

        return resolve({
          price: parsePrice(res.executedOrderPrice),
          currency: res.executedOrderPrice.currency,
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
    sandboxApi.sandbox.getSandboxOrderState(
      { accountId, orderId },
      (error, res) => {
        if (error) return reject(error)

        return resolve({
          price: parsePrice(res.executedOrderPrice),
          currency: res.executedOrderPrice.currency,
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
      }
    )
  )

export const parseDateToRequest = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanos: (date.getTime() % 1000) * 1e6,
})

type Timestamp = {
  seconds: string
  nanos: number
}

export const parseDateToResponse = (timestamp?: Timestamp) =>
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
    sandboxApi.instruments.tradingSchedules(
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
    sandboxApi.marketData.getCandles(
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

//
// Prod methods
// ------------

type Account = {
  id: string
}

export const getAccounts = () =>
  new Promise<Account[]>((resolve, reject) =>
    api.usersService.getAccounts({}, (error, res) => {
      if (error) return reject(error)

      return resolve(res.accounts)
    })
  )

export type Operation = {
  id: string
  figi: string
  parentOperationId: string
  currency: string
  payment: number
  price: number
  quantity: number
  date: Date
  type: string
  operationType: string
}

export const getOperations = (
  accountId: string,
  from: Date,
  to: Date,
  state = 1,
  figi?: string
) =>
  new Promise<Operation[]>((resolve, reject) =>
    api.operations.getOperations(
      {
        accountId,
        from: parseDateToRequest(from),
        to: parseDateToRequest(to),
        state,
        figi,
      },
      (error, res) => {
        if (error) return reject(error)

        return resolve(
          res.operations.map((operation) => ({
            id: operation.id,
            figi: operation.figi,
            parentOperationId: operation.parentOperationId,
            currency: operation.currency,
            payment: parsePrice(operation.payment),
            price: parsePrice(operation.price),
            quantity: parseInt(operation.quantity),
            date: parseDateToResponse(operation.date),
            type: operation.type,
            operationType: operation.operationType,
          }))
        )
      }
    )
  )

export type PortfolioPosition = {
  figi: string
  instrumentType: string
  quantity: number
}

export const getOpenPositions = (accountId: string) =>
  new Promise<PortfolioPosition[]>((resolve, reject) =>
    api.operations.getPortfolio({ accountId }, (err, res) => {
      if (err) return reject(err)

      return resolve(
        res.positions.map((position) => ({
          figi: position.figi,
          instrumentType: position.instrumentType,
          quantity: parsePrice(position.quantity),
        }))
      )
    })
  )

import { OpenAPIClient } from '@tinkoff/invest-js'
import {
  Quotation,
  Quotation__Output,
} from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Quotation'
import {
  Share,
  Share__Output,
} from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Share'
import { Account } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Account'
import { Instrument__Output } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Instrument'
import { Currency } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/Currency'

import { Order, OrderDirection, OrderType } from './db'

const api = new OpenAPIClient({
  token: process.env.API_TOKEN,
})

const sandboxApi = new OpenAPIClient({
  token: process.env.API_TOKEN_SANDBOX,
})

const NANO_DIVIDER = 1000000000

export const parseQuotation = (value: Quotation__Output) =>
  Number.parseFloat(
    (parseInt(value.units) + value.nano / NANO_DIVIDER).toFixed(2)
  )

export const getCurrencies = () =>
  new Promise<Currency[]>((resolve, reject) =>
    api.instruments.currencies({}, (error, { instruments }) => {
      if (error) return reject(error)

      return resolve(instruments)
    })
  )

type LastPrice = {
  figi: string
  price: number
  date: Date
}

export const getLastPrices = (figi: string[]) =>
  new Promise<LastPrice[]>((resolve, reject) =>
    api.marketData.getLastPrices({ figi }, (error, { lastPrices }) => {
      if (error) return reject(error)

      return resolve(
        lastPrices.map((lastPrice) => ({
          figi: lastPrice.figi,
          price: parseQuotation(lastPrice.price),
          date: parseDateToResponse(lastPrice.time),
        }))
      )
    })
  )

export type Instrument = {
  figi: string
  ticker: string
  exchange: string
  isShortEnable: boolean
  isTradeAvailable: boolean
  tickValue: number
  kLong: number
  kShort: number
  currency: string
}

type InstrumentType = 'future' | 'share'

const instrumentToResponse = (
  instrument: Instrument__Output | Share__Output
): Instrument => ({
  figi: instrument.figi,
  ticker: instrument.ticker,
  exchange: instrument.exchange,
  isShortEnable: instrument.shortEnabledFlag,
  isTradeAvailable: instrument.apiTradeAvailableFlag,
  tickValue: parseQuotation(instrument.minPriceIncrement),
  kLong: 1 / parseQuotation(instrument.dlong),
  kShort: 1 / parseQuotation(instrument.dshort),
  currency: instrument.currency,
})

export const getInstrument = (ticker: string, type: InstrumentType) =>
  new Promise<Instrument>((resolve, reject) =>
    sandboxApi.instruments[
      type === 'share' ? 'shares' : ('futures' as 'shares')
    ]({}, (error, res) => {
      if (error) return reject(error)

      const instrument = res.instruments.find(
        (instrument) => instrument.ticker === ticker
      )

      if (!instrument) return reject(new Error('Instrument not found'))

      return resolve(instrumentToResponse(instrument))
    })
  )

export const getInstrumentByUid = (uid: string) =>
  new Promise<Instrument>((resolve, reject) =>
    api.instruments.getInstrumentBy(
      { idType: 'INSTRUMENT_ID_TYPE_UID', id: uid },
      (error, { instrument }) => {
        if (error) return reject(error)

        return resolve(instrumentToResponse(instrument))
      }
    )
  )

export const getInstrumentByFigi = (figi: string) =>
  new Promise<Instrument>((resolve, reject) =>
    sandboxApi.instruments.getInstrumentBy(
      { idType: 'INSTRUMENT_ID_TYPE_FIGI', id: figi },
      (err, { instrument }) => {
        if (err) return reject(err)

        return resolve(instrumentToResponse(instrument))
      }
    )
  )

export const marketDataStream = sandboxApi.marketDataStream.marketDataStream()

export const subscribeToOrderBook = (figi: Share['figi']) =>
  marketDataStream.write({
    subscribeOrderBookRequest: {
      instruments: [{ figi, depth: 1 }],
      subscriptionAction: 'SUBSCRIPTION_ACTION_SUBSCRIBE',
    },
  })

export const unsubscribeFromOrderBook = (figi: Share['figi']) =>
  marketDataStream.write({
    subscribeOrderBookRequest: {
      instruments: [{ figi }],
      subscriptionAction: 'SUBSCRIPTION_ACTION_UNSUBSCRIBE',
    },
  })

export const addSandboxAccount = () =>
  new Promise<string>((resolve, reject) =>
    sandboxApi.sandbox.openSandboxAccount({}, (error, { accountId }) => {
      if (error) return reject(error)

      return resolve(accountId)
    })
  )

export const getOrCreateSandboxAccountId = () =>
  new Promise<string>((resolve, reject) =>
    api.sandbox.getSandboxAccounts({}, (error, { accounts }) => {
      if (error) return reject(error)

      const account = accounts[accounts.length - 1]

      if (account) return resolve(account.id)

      sandboxApi.sandbox.openSandboxAccount({}, (error, { accountId }) => {
        if (error) return reject(error)

        return resolve(accountId)
      })
    })
  )

export const getAccounts = () =>
  new Promise<Account[]>((resolve, reject) =>
    api.usersService.getAccounts({}, (error, { accounts }) => {
      if (error) return reject(error)

      return resolve(accounts)
    })
  )

export const getSandboxAccounts = () =>
  new Promise<Account[]>((resolve, reject) =>
    api.sandbox.getSandboxAccounts({}, (error, { accounts }) => {
      if (error) return reject(error)

      return resolve(accounts)
    })
  )

export const getLiquidPortfolio = (accountId: string) =>
  new Promise<number>((resolve, reject) =>
    api.usersService.getMarginAttributes({ accountId }, (error, res) => {
      if (error) return reject(error)

      return resolve(parseQuotation(res.liquidPortfolio))
    })
  )

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
          price: parseQuotation(res.executedOrderPrice),
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
          price: parseQuotation(res.executedOrderPrice),
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
            low: parseQuotation(candle.low),
            open: parseQuotation(candle.open),
            close: parseQuotation(candle.close),
            high: parseQuotation(candle.high),
            volume: parseInt(candle.volume),
          }))
        )
      }
    )
  })

//
// Prod methods
// ------------

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
            payment: parseQuotation(operation.payment),
            price: parseQuotation(operation.price),
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
          quantity: parseQuotation(position.quantity),
        }))
      )
    })
  )

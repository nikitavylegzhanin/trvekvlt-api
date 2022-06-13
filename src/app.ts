import { Raw } from 'typeorm'
import { not, isNil, pipe, reduce, filter, uniq, without } from 'ramda'

import db from './db'
import {
  getInstrument,
  getTradingSchedule,
  marketDataStream,
  placeOrder,
} from './api'
import store from './store'
import { StoredBot, initBots, selectBots } from './store/bots'
import { Bot, Level, Trend, Position } from './db'
import { getBotById, getLastTrend, getLastPrice } from './strategy/utils'
import { runStartegy } from './strategy'

const getRelatedLevels = pipe(
  reduce<Position, Level[]>(
    (arr, position) => [...arr, position.openLevel, position.closedLevel],
    []
  ),
  filter(pipe(isNil, not)),
  uniq
)

export const getBots = async () => {
  const bots = await db.manager.find(Bot, {
    relations: ['levels'],
  })

  const storedBots: StoredBot[] = [...bots].map((bot) => ({
    ...bot,
    figi: '',
    startDate: null,
    endDate: null,
    isShortEnable: false,
    positions: [],
    trends: [],
  }))

  await Promise.all(
    storedBots.map(async (bot) => {
      const instrument = await getInstrument(bot.ticker, bot.instrumentType)

      if (!instrument.isTradeAvailable)
        throw new Error('Instrument is not available for trade')

      const schedule = await getTradingSchedule(instrument.exchange, new Date())

      // last trend
      const lastTrend = await db.manager.findOneOrFail(Trend, {
        where: {
          bot: {
            id: bot.id,
          },
        },
      })

      // positions of the current trading day
      const positions = await db.manager.find(Position, {
        relations: ['openLevel', 'closedLevel', 'orders'],
        where: {
          bot: { id: bot.id },
          createdAt: Raw((alias) => `${alias} BETWEEN :from AND :to`, {
            from: new Date(new Date().setHours(0, 0, 1, 0)),
            to: new Date(new Date().setHours(23, 59, 59, 0)),
          }),
        },
      })

      const relatedLevels = without(bot.levels, getRelatedLevels(positions))

      bot.figi = instrument.figi
      bot.isShortEnable = instrument.isShortEnable
      bot.positions = positions
      bot.startDate = schedule.startDate
      bot.endDate = schedule.endDate
      bot.trends = [lastTrend]
      bot.levels = [...bot.levels, ...relatedLevels]

      return bot
    })
  )

  store.dispatch(initBots(storedBots))

  return storedBots
}

type Order = {
  price: number
  quantity: number
}

const parseOrder = (data: any): Order => ({
  price: Number.parseFloat(
    (parseInt(data?.price?.units) + data?.price?.nano / 1000000000).toFixed(2)
  ),
  quantity: Number.parseInt(data?.quantity),
})

export const run = async (bot: StoredBot) => {
  const placeOrderByDirection = (direction: 1 | 2, quantity = 1) =>
    placeOrder(bot.figi, quantity, direction, bot.accountId)

  marketDataStream.on('error', console.error)

  let bidPrice = 0,
    askPrice = 0,
    isTransaction = false

  marketDataStream.on('data', async (data) => {
    if (!data?.payload || isTransaction) return

    if (data.payload === 'orderbook') {
      const lastBid = parseOrder(data?.orderbook?.bids[0])
      const lastAsk = parseOrder(data?.orderbook?.asks[0])

      // обрабатываем торговую логику при изменении цены
      if (bidPrice !== lastBid.price || askPrice !== lastAsk.price) {
        bidPrice = lastBid.price
        askPrice = lastAsk.price
        isTransaction = true

        const bots = selectBots(store.getState())
        const lastTrend = getLastTrend(getBotById(bots, bot.id))
        const lastPrice = getLastPrice(askPrice, bidPrice, lastTrend)

        await runStartegy(bot.id, lastPrice, placeOrderByDirection)

        return (isTransaction = false)
      }
    }
  })

  marketDataStream.write({
    subscribeOrderBookRequest: {
      instruments: [{ figi: bot.figi, depth: 1 }],
      subscriptionAction: 'SUBSCRIPTION_ACTION_SUBSCRIBE',
    },
  })
}

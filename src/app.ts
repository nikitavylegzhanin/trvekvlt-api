import { Raw } from 'typeorm'
import { not, isNil, pipe, reduce, filter, uniq, without, propEq } from 'ramda'

import db, { BotStatus } from './db'
import { getInstrument, getTradingSchedule, marketDataStream } from './api'
import store from './store'
import { StoredBot, initBots, selectBots, editBot } from './store/bots'
import { Bot, Level, Trend, Position } from './db'
import { getLastTrend, getLastPrice } from './strategy/utils'
import { runStrategy } from './strategy'

const getRelatedLevels = pipe(
  reduce<Position, Level[]>(
    (arr, position) => [...arr, position.openLevel, position.closedLevel],
    []
  ),
  filter(pipe(isNil, not)),
  uniq
)

export const toStore = async (bot: Bot): Promise<StoredBot> => {
  const instrument = await getInstrument(bot.ticker, bot.instrumentType)

  if (!instrument.isTradeAvailable)
    throw new Error('Instrument is not available for trade')

  const schedule = await getTradingSchedule(instrument.exchange, new Date())

  // last trend
  const lastTrend = await db.manager.findOneOrFail(Trend, {
    order: { createdAt: 'DESC' },
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

  return {
    ...bot,
    positions,
    trends: [lastTrend],
    levels: [...bot.levels, ...relatedLevels],
    figi: instrument.figi,
    isShortEnable: instrument.isShortEnable,
    tickValue: instrument.tickValue,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    isProcessing: false,
  }
}

export const init = async () => {
  const bots = await db.manager.find(Bot, {
    relations: ['levels'],
  })
  const storedBots = await Promise.all(bots.map(toStore))

  store.dispatch(initBots(storedBots))

  marketDataStream.write({
    subscribeOrderBookRequest: {
      instruments: storedBots
        .filter(propEq('status', BotStatus.RUNNING))
        .map((bot) => ({ figi: bot.figi, depth: 1 })),
      subscriptionAction: 'SUBSCRIPTION_ACTION_SUBSCRIBE',
    },
  })

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

export const run = async () => {
  marketDataStream.on('data', (data) => {
    if (data.payload === 'orderbook') {
      const bots = selectBots(store.getState())
      const { figi, bids, asks } = data[data.payload]

      bots.filter(propEq('figi', figi)).forEach((bot) => {
        const lastPrice = getLastPrice(
          parseOrder(bids[0]).price,
          parseOrder(asks[0]).price,
          getLastTrend(bot)
        )

        runStrategy(bot.id, lastPrice).then(() =>
          store.dispatch(editBot({ id: bot.id, isProcessing: false }))
        )
      })
    }
  })
}

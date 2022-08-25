import { propEq } from 'ramda'

import db, { Bot, BotStatus } from './db'
import { getBots } from './app'
import { startServer, logUrl } from './server'
import { marketDataStream, placeOrder } from './api'
import { runStartegy } from './strategy'
import { getLastTrend, getLastPrice } from './strategy/utils'
import store from './store'

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

db.initialize()
  .then(getBots)
  .then((bots) =>
    marketDataStream.write({
      subscribeOrderBookRequest: {
        instruments: bots
          .filter(propEq('status', BotStatus.RUNNING))
          .map((bot) => ({ figi: bot.figi, depth: 1 })),
        subscriptionAction: 'SUBSCRIPTION_ACTION_SUBSCRIBE',
      },
    })
  )
  .then(() => {
    const transactions: Bot['id'][] = []

    marketDataStream.on('error', console.error)

    marketDataStream.on('data', (data) => {
      if (data.payload === 'orderbook') {
        const { figi, bids, asks } = data[data.payload]
        const { bots } = store.getState()

        bots.filter(propEq('figi', figi)).forEach((bot) => {
          if (transactions.includes(bot.id)) return

          const length = transactions.push(bot.id)

          const bidPrice = parseOrder(bids[0])
          const askPrice = parseOrder(asks[0])
          const lastTrend = getLastTrend(bot)
          const lastPrice = getLastPrice(
            askPrice.price,
            bidPrice.price,
            lastTrend
          )
          const placeOrderByDirection = (direction: 1 | 2, quantity = 1) =>
            placeOrder(bot.figi, quantity, direction, bot.accountId)

          runStartegy(bot.id, lastPrice, placeOrderByDirection).then(() => {
            transactions.splice(length - 1, 1)
          })
        })
      }
    })
  })
  .then(startServer)
  .then(logUrl)
  .catch(console.error)

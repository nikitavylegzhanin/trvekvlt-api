import { Connection, Raw } from 'typeorm'
import { pick, not, isNil, pipe, reduce, filter, uniq, without } from 'ramda'

import {
  getInstrument,
  getTradingSchedule,
  marketDataStream,
  getSandboxAccountId,
  placeOrder,
} from './api'
import store from './store'
import { initLevels, addLevels } from './store/levels'
import { initTrends, selectLastTrend } from './store/trends'
import { initPositions } from './store/positions'
import { Level, Trend, Position } from './db'
import { editConfig } from './store/config'
import { getLastPrice } from './strategy/utils'
import { runStartegy } from './strategy'

const getRelatedLevels = pipe(
  reduce<Position, Level[]>(
    (arr, position) => [...arr, position.openLevel, position.closedLevel],
    []
  ),
  filter(pipe(isNil, not)),
  uniq
)

export const init = async ({ manager }: Connection) => {
  // Init levels, trends, positions
  const levels = await manager.find(Level)
  store.dispatch(initLevels(levels.map(pick(['id', 'value']))))

  const trends = await manager.find(Trend)
  store.dispatch(initTrends(trends.map(pick(['id', 'direction', 'type']))))

  const positions = await manager.find(Position, {
    relations: ['openLevel', 'closedLevel'],
    where: {
      createdAt: Raw((alias) => `${alias} BETWEEN :from AND :to`, {
        from: new Date(new Date().setHours(0, 0, 1, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 0)),
      }),
    },
  })
  store.dispatch(
    initPositions(
      positions.map((position) => ({
        ...pick(
          ['id', 'closingRules', 'closedByRule', 'status', 'openedByRules'],
          position
        ),
        openLevelId: position.openLevel?.id,
        closedLevelId: position.closedLevel?.id,
      }))
    )
  )

  // Add related levels if not loaded
  const relatedLevels = without(levels, getRelatedLevels(positions))
  if (relatedLevels.length) {
    store.dispatch(addLevels(relatedLevels.map(pick(['id', 'value']))))
  }

  return
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
  const { figi, exchange } = await getInstrument('SFM2', 'future')

  const accountId = await getSandboxAccountId()
  const schedule = await getTradingSchedule(exchange, new Date())

  if (!schedule.isTradingDay) {
    throw new Error('Is not a trading day')
  }

  store.dispatch(editConfig({ ...schedule, figi }))

  const placeOrderByDirection = (direction: 1 | 2) =>
    placeOrder(figi, 1, direction, accountId)

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

        const lastTrend = selectLastTrend(store.getState())
        const lastPrice = getLastPrice(askPrice, bidPrice, lastTrend)

        await runStartegy(lastPrice, placeOrderByDirection)

        return (isTransaction = false)
      }
    }
  })

  marketDataStream.write({
    subscribeOrderBookRequest: {
      instruments: [{ figi, depth: 1 }],
      subscriptionAction: 'SUBSCRIPTION_ACTION_SUBSCRIBE',
    },
  })
}

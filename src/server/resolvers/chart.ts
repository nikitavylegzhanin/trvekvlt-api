import { Config } from 'apollo-server'
import { Between, LessThan } from 'typeorm'

import db, { Bot, Trend, Position, Order } from '../../db'
import { getInstrument, getCandles } from '../../api'

export const chart: Config['fieldResolver'] = async (
  _parent,
  args: { botId: Bot['id']; from: Date; to: Date; interval: number }
) => {
  const bot = await db.manager.findOneOrFail(Bot, {
    where: { id: args.botId },
  })

  const { figi } = await getInstrument(bot.ticker, bot.instrumentType)
  const from = new Date(args.from)
  const to = new Date(args.to)
  const candles = await getCandles(figi, from, to, args.interval)

  const firstTrend = await db.manager.findOne(Trend, {
    order: { createdAt: 'DESC' },
    where: { bot: { id: bot.id }, createdAt: LessThan(from) },
  })
  const trends = await db.manager.find(Trend, {
    where: { bot: { id: bot.id }, createdAt: Between(from, to) },
  })

  const positions = await db.manager.find(Position, {
    relations: ['orders'],
    where: { bot: { id: bot.id }, createdAt: Between(from, to) },
  })
  const orders = positions.reduce(
    (arr, position) => [
      ...arr,
      ...position.orders.map((order) => ({
        ...order,
        position: {
          ...position,
          orders: undefined,
        },
      })),
    ],
    [] as Order[]
  )

  return {
    candles,
    trends: [firstTrend, ...trends],
    orders,
  }
}

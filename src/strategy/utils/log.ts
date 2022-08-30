import { propEq } from 'ramda'

import store from '../../store'
import { StoredBot } from '../../store/bots/reducer'
import { getBotById } from './bot'
import { getLastTrend } from './trend'
import { getTargetValue } from './level'
import {
  Level,
  OrderRule,
  TrendDirection,
  Order,
  OrderDirection,
  Trend,
} from '../../db'

export const getOpenPositionMessage = (
  botId: StoredBot['id'],
  openLevel: Level,
  openingRule: OrderRule
) => {
  const bot = getBotById(store.getState().bots, botId)
  const trend = getLastTrend(bot)

  const targetValue = getTargetValue(bot.levels, openLevel, trend)
  const percent =
    ((trend.direction === TrendDirection.UP
      ? targetValue / openLevel.value
      : openLevel.value / targetValue) -
      1) *
    100

  const message = `
    **${bot.name}** (${bot.ticker})

    **Open position**
      - Level: ${openLevel.value}
      - Rule: ${'`'}${openingRule}${'`'}
      - Trend: UP
      - Target: ${targetValue || 'MAX_PROFIT_VALUE'} (${percent.toFixed(2)}%)
  `

  return message.trim()
}

const sumOrders = (sum: number, order: Order) =>
  sum + order.price * order.quantity

export const getClosePositionMessage = (
  botId: StoredBot['id'],
  closingRule: OrderRule,
  orders: Order[]
) => {
  const bot = getBotById(store.getState().bots, botId)

  const sellSum = orders
    .filter(propEq('direction', OrderDirection.SELL))
    .reduce(sumOrders, 0)

  const buySum = orders
    .filter(propEq('direction', OrderDirection.BUY))
    .reduce(sumOrders, 0)

  const profit = sellSum - buySum
  const percent =
    (profit /
      (orders[orders.length - 1].direction === OrderDirection.SELL
        ? buySum
        : sellSum)) *
    100

  const message = `
    **${bot.name}** (${bot.ticker})

    **Close position**
      - Rule: ${'`'}${closingRule}${'`'}
      - Orders: ${orders.map(
        (order) => `
          - ${order.direction}: ${order.price} ${order.currency} x ${order.quantity}`
      )}
      - Profit: ${profit.toFixed(2)} ${orders[0].currency} (${percent.toFixed(
    2
  )}%)
  `

  return message.trim()
}

export const getCorrectionMessage = (botId: StoredBot['id'], trend: Trend) => {
  const bot = getBotById(store.getState().bots, botId)

  const message = `
    **${bot.name}** (${bot.ticker})

    **Correction**
    ${
      trend.direction === TrendDirection.UP
        ? TrendDirection.DOWN
        : TrendDirection.UP
    } → ${trend.direction}
  `

  return message.trim()
}

export const getDisableBotTillTomorrowMessage = (
  botId: StoredBot['id'],
  error?: Error
) => {
  const bot = getBotById(store.getState().bots, botId)

  const message = `
    **${bot.name}** (${bot.ticker})

    The bot is disabled until the next trading session

    ${error ? JSON.stringify(error) : ''}
  `

  return message.trim()
}

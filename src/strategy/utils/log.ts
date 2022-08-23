import store from '../../store'
import { StoredBot } from '../../store/bots/reducer'
import { getBotById } from './bot'
import { getLastTrend } from './trend'
import { getTargetValue } from './level'
import { Level, OrderRule, TrendDirection } from '../../db'

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

import { or } from 'ramda'

import store from '../store'
import { selectBots, editBot } from '../store/bots'
import { PositionClosingRule } from '../db/Position'
import { openPosition, averagingPosition, closePosition } from './position'
import { isTradingInterval } from './marketPhase'
import {
  manageClosingRules,
  isTp,
  isSlt50Percent,
  isSlt3Ticks,
  isSl,
  getNextOpeningRule,
  isAbleToCloseBySlt3Ticks,
} from './rules'
import { addCorrectionTrend } from './trend'
import {
  getBotById,
  isBotDisabled,
  getLastPosition,
  getLastTrend,
  isLevelDisabled,
  getPriceDistanceToPrevLevel,
  getPositionProfit,
  isLastPositionClosed,
  isLastPositionOpen,
  isLastPositionOpenPartially,
  getLastClosedPosition,
  isCorrectionTrend,
  isLastLevel,
  getNextLevel,
  getOpenOperation,
  getCloseOperation,
  isOpeningRuleAvailable,
  isDowntrend,
  getOpenPositionValue,
} from './utils'
import { Order } from '../api'
import { Bot } from '../db'
import { disableBotTillTomorrow } from './bot'

type PlaceOrderByDirection = (
  direction: 1 | 2,
  quantity?: number
) => Promise<Order>

export const runStartegy = async (
  botId: Bot['id'],
  lastPrice: number,
  placeOrder: PlaceOrderByDirection
) => {
  const state = store.getState()
  const bots = selectBots(state)
  const bot = getBotById(bots, botId)

  // пропускаем торговлю если движок выключен
  if (isBotDisabled(bot)) return

  const date = new Date()
  const lastPosition = getLastPosition(bot)
  const lastTrend = getLastTrend(bot)

  if (!isTradingInterval(date, bot.startDate, bot.endDate)) {
    // закрываем позицию по окночании торговой фазы
    if (isLastPositionOpen(lastPosition?.status)) {
      const operation = getCloseOperation(lastTrend)

      await closePosition(
        () => placeOrder(operation, getOpenPositionValue(lastPosition)),
        bot.id,
        lastPosition,
        PositionClosingRule.MARKET_PHASE_END
      )
    }

    // сбрасываем данные по позициям при закрытии торговой фазы
    if (!!lastPosition) {
      store.dispatch(editBot({ id: bot.id, positions: [] }))
    }

    // пропускаем торговлю вне торговой фазы
    return
  }

  if (!lastTrend) {
    throw new Error('Last trend is undefined')
  }

  const { levels } = bot
  const isShort = isDowntrend(lastTrend)
  const distance = getPriceDistanceToPrevLevel(
    levels,
    lastPrice,
    isShort,
    lastPosition?.openLevel,
    lastPosition?.closedLevel
  )

  // менеджерим правила при изменении цены
  if (lastPosition) {
    await manageClosingRules(bot.id, distance, lastPosition)
  }

  const nextLevel = getNextLevel(levels, lastPrice)
  const isClosed = isLastPositionClosed(lastPosition)
  const isOpenPartially = isLastPositionOpenPartially(lastPosition)

  if (
    nextLevel &&
    or(isClosed, isOpenPartially) &&
    (!isShort || bot.isShortEnable)
  ) {
    if (
      !isLevelDisabled(nextLevel) &&
      !isLastLevel(nextLevel.id, levels) &&
      (isClosed || !isAbleToCloseBySlt3Ticks(lastPosition.closingRules))
    ) {
      // добавляем только если следующее правило открытия доступно
      const operation = getOpenOperation(lastTrend)
      const openingRule = getNextOpeningRule(
        lastPrice,
        nextLevel.value,
        operation
      )

      if (isOpeningRuleAvailable(openingRule, lastPosition)) {
        // усредняем если позиция не закрыта
        if (isOpenPartially) {
          return averagingPosition(
            () => placeOrder(operation),
            bot.id,
            lastPosition,
            openingRule
          )
        }

        // иначе открываем новую
        await openPosition(
          () => placeOrder(operation),
          bot.id,
          nextLevel,
          openingRule
        )

        return
      }
    }
  }

  // закрываем открытую позицию по tp, slt, sl
  if (isLastPositionOpen(lastPosition?.status)) {
    const operation = getCloseOperation(lastTrend)
    const placeOrderFn = () =>
      placeOrder(operation, getOpenPositionValue(lastPosition))

    if (isTp(nextLevel, lastPosition.openLevel)) {
      await closePosition(
        placeOrderFn,
        bot.id,
        lastPosition,
        PositionClosingRule.TP,
        nextLevel,
        nextLevel
      )

      return
    }

    if (isSlt50Percent(lastPosition.closingRules, distance)) {
      await closePosition(
        placeOrderFn,
        bot.id,
        lastPosition,
        PositionClosingRule.SLT_50PERCENT,
        lastPosition.openLevel
      )

      return
    }

    // slt 3ticks
    if (
      isSlt3Ticks(
        lastPosition.closingRules,
        lastPosition.openLevel,
        lastPrice,
        isShort
      )
    ) {
      await closePosition(
        placeOrderFn,
        bot.id,
        lastPosition,
        PositionClosingRule.SLT_3TICKS,
        lastPosition.openLevel
      )

      return
    }

    // sl
    const positionProfit = getPositionProfit(
      lastPosition.openLevel,
      lastTrend,
      lastPrice
    )
    if (isSl(lastPosition.closingRules, positionProfit, distance)) {
      await closePosition(
        placeOrderFn,
        bot.id,
        lastPosition,
        PositionClosingRule.SL
      )

      // стоп на коррекции → выключаем движок DISABLED_TILL_TOMORROW
      if (isCorrectionTrend(lastTrend)) {
        await disableBotTillTomorrow(bot.id)

        return
      }

      // 2 стопа подряд → коррекция
      const { positions } = bot
      const lastClosedPosition = getLastClosedPosition(positions)

      if (lastClosedPosition?.closedByRule === PositionClosingRule.SL) {
        await addCorrectionTrend(bot.id, lastTrend)
      }
    }
  }

  // нет действий по текущей цене
  return
}

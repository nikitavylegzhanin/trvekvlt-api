import { or } from 'ramda'

import store from '../store'
import { selectBots, editBot } from '../store/bots'
import { OrderRule } from '../db/Order'
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
// prettier-ignore
import {
  getBotById, isBotDisabled, getLastPosition, getLastTrend, isLevelDisabled,
  getPriceDistanceToPrevLevel, getPositionProfit, isLastPositionClosed,
  isLastPositionOpen, isLastPositionOpenPartially, getLastClosedPosition,
  isCorrectionTrend, isLastLevel, getNextLevel, getOpenOperation,
  isOpeningRuleAvailable, isDowntrend, getPositionAvgPrice, isClosedBySL
} from './utils'
import { Bot } from '../db'
import { disableBotTillTomorrow } from './bot'

export const runStrategy = async (botId: Bot['id'], lastPrice: number) => {
  const state = store.getState()
  const bots = selectBots(state)
  const bot = getBotById(bots, botId)

  // пропускаем торговлю если движок выключен или в процессе обработки
  if (isBotDisabled(bot) || bot.isProcessing)
    return store.dispatch(editBot({ id: bot.id, lastPrice }))

  // начинаем процесс обработки торговой стратегии
  store.dispatch(editBot({ id: bot.id, isProcessing: true, lastPrice }))

  const date = new Date()
  const lastPosition = getLastPosition(bot)
  const lastTrend = getLastTrend(bot)

  if (!isTradingInterval(date, bot.startDate, bot.endDate)) {
    // закрываем позицию по окночании торговой фазы
    if (isLastPositionOpen(lastPosition?.status)) {
      await closePosition(
        bot.id,
        lastPosition,
        OrderRule.CLOSE_BY_MARKET_PHASE_END
      )
    }

    // сбрасываем данные по позициям при закрытии торговой фазы и пропускаем торговлю
    return store.dispatch(
      editBot({ id: bot.id, isProcessing: false, positions: [] })
    )
  }

  if (!lastTrend) {
    throw new Error('Last trend is undefined')
  }

  const { levels, tickValue } = bot
  const isShort = isDowntrend(lastTrend)
  const positionAvgPrice = lastPosition
    ? getPositionAvgPrice(lastPosition)
    : undefined
  const distance = getPriceDistanceToPrevLevel(
    levels,
    lastPrice,
    tickValue,
    isShort,
    lastPosition?.openLevel,
    positionAvgPrice,
    lastPosition?.closedLevel
  )

  // менеджерим правила при изменении цены
  if (lastPosition) {
    await manageClosingRules(bot.id, distance, lastPosition)
  }

  const nextLevel = getNextLevel(levels, lastPrice, tickValue)
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
      (isClosed || !isAbleToCloseBySlt3Ticks(lastPosition.availableRules))
    ) {
      // добавляем только если следующее правило открытия доступно
      const operation = getOpenOperation(lastTrend)
      const openingRule = getNextOpeningRule(
        lastPrice,
        nextLevel.value,
        tickValue,
        operation
      )

      if (isOpeningRuleAvailable(openingRule, lastPosition)) {
        // усредняем если позиция не закрыта
        if (isOpenPartially) {
          await averagingPosition(bot.id, lastPosition, openingRule)

          // процесс выполнен
          return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
        }

        // иначе открываем новую
        await openPosition(bot.id, nextLevel, openingRule)

        // процесс выполнен
        return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
      }
    }
  }

  // закрываем открытую позицию по tp, slt, sl
  if (isLastPositionOpen(lastPosition?.status)) {
    if (isTp(nextLevel, lastPosition.openLevel)) {
      await closePosition(
        bot.id,
        lastPosition,
        OrderRule.CLOSE_BY_TP,
        nextLevel,
        nextLevel
      )

      // процесс выполнен
      return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
    }

    if (isSlt50Percent(lastPosition.availableRules, distance)) {
      await closePosition(
        bot.id,
        lastPosition,
        OrderRule.CLOSE_BY_SLT_50PERCENT,
        lastPosition.openLevel
      )

      // процесс выполнен
      return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
    }

    // slt 3ticks
    if (
      isSlt3Ticks(
        lastPosition.availableRules,
        positionAvgPrice,
        lastPrice,
        tickValue,
        isShort
      )
    ) {
      await closePosition(
        bot.id,
        lastPosition,
        OrderRule.CLOSE_BY_SLT_3TICKS,
        lastPosition.openLevel
      )

      // процесс выполнен
      return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
    }

    // sl
    const positionProfit = getPositionProfit(
      lastPosition.openLevel,
      lastTrend,
      lastPrice
    )

    if (isSl(lastPosition.availableRules, positionProfit, distance)) {
      await closePosition(bot.id, lastPosition, OrderRule.CLOSE_BY_SL)

      // стоп на коррекции → выключаем движок DISABLED_TILL_TOMORROW
      if (isCorrectionTrend(lastTrend)) {
        await disableBotTillTomorrow(bot.id)

        // процесс выполнен
        return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
      }

      // 2 стопа подряд → коррекция
      const { positions } = bot
      const lastClosedPosition = getLastClosedPosition(positions)

      if (lastClosedPosition && isClosedBySL(lastClosedPosition)) {
        await addCorrectionTrend(bot.id, lastTrend)
      }
    }
  }

  // нет действий по текущей цене
  return store.dispatch(editBot({ id: bot.id, isProcessing: false }))
}

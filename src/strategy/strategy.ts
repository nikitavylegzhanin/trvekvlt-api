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
  if (isBotDisabled(bot) || bot.isProcessing) return

  // начинаем процесс обработки торговой стратегии
  store.dispatch(
    editBot({
      id: bot.id,
      isProcessing: process.env.NODE_ENV !== 'test',
      lastPrice,
    })
  )

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
  const positionAvgPrice = lastPosition
    ? getPositionAvgPrice(lastPosition)
    : undefined
  const distance = getPriceDistanceToPrevLevel(
    levels,
    lastPrice,
    isShort,
    lastPosition?.openLevel,
    positionAvgPrice,
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
      (isClosed || !isAbleToCloseBySlt3Ticks(lastPosition.availableRules))
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
          return averagingPosition(bot.id, lastPosition, openingRule)
        }

        // иначе открываем новую
        await openPosition(bot.id, nextLevel, openingRule)

        return
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

      return
    }

    if (isSlt50Percent(lastPosition.availableRules, distance)) {
      await closePosition(
        bot.id,
        lastPosition,
        OrderRule.CLOSE_BY_SLT_50PERCENT,
        lastPosition.openLevel
      )

      return
    }

    // slt 3ticks
    if (
      isSlt3Ticks(
        lastPosition.availableRules,
        positionAvgPrice,
        lastPrice,
        isShort
      )
    ) {
      await closePosition(
        bot.id,
        lastPosition,
        OrderRule.CLOSE_BY_SLT_3TICKS,
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

    if (isSl(lastPosition.availableRules, positionProfit, distance)) {
      await closePosition(bot.id, lastPosition, OrderRule.CLOSE_BY_SL)

      // стоп на коррекции → выключаем движок DISABLED_TILL_TOMORROW
      if (isCorrectionTrend(lastTrend)) {
        await disableBotTillTomorrow(bot.id)

        return
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
  return
}

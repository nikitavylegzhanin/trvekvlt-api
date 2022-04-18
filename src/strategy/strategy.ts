import { OperationType, Operation } from '@tinkoff/invest-openapi-js-sdk'
import { or } from 'ramda'

import store from '../store'
import {
  selectLastPositionWithLevels,
  selectPositions,
  initPositions,
} from '../store/positions'
import { selectLevels } from '../store/levels'
import { editConfig, selectConfig } from '../store/config'
import { selectLastTrend } from '../store/trends'
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
  getLastPrice,
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
} from './utils'

type PlaceOrder = (operation: OperationType) => Promise<Operation>

export const runStartegy = (
  ask: number,
  bid: number,
  placeOrder: PlaceOrder
) => {
  const state = store.getState()
  const config = selectConfig(state)

  // пропускаем торговлю если движок выключен
  if (config.isDisabled) return

  const date = new Date()
  const lastPosition = selectLastPositionWithLevels(state)
  const lastTrend = selectLastTrend(state) // TODO selectOrFail

  if (!isTradingInterval(date)) {
    // закрываем позицию по окночании торговой фазы
    if (isLastPositionOpen(lastPosition?.status)) {
      const operation = getCloseOperation(lastTrend)

      closePosition(
        () => placeOrder(operation),
        lastPosition.id,
        PositionClosingRule.MARKET_PHASE_END
      )
    }

    // сбрасываем данные по позициям при закрытии торговой фазы
    if (!!lastPosition) {
      store.dispatch(initPositions([]))
    }

    // пропускаем торговлю вне торговой фазы
    return
  }

  if (!lastTrend) {
    throw new Error('Last trend is undefined')
  }

  const levels = selectLevels(state)
  const lastPrice = getLastPrice(ask, bid, lastTrend)
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
    manageClosingRules(distance, lastPosition)
  }

  const nextLevel = getNextLevel(levels, lastPrice)
  const isClosed = isLastPositionClosed(lastPosition)
  const isOpenPartially = isLastPositionOpenPartially(lastPosition)

  if (nextLevel && or(isClosed, isOpenPartially)) {
    if (
      !nextLevel.isDisabled &&
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
            lastPosition,
            openingRule
          )
        }

        // иначе открываем новую
        return openPosition(
          () => placeOrder(operation),
          nextLevel.id,
          openingRule
        )
      }
    }
  }

  // закрываем открытую позицию по tp, slt, sl
  if (isLastPositionOpen(lastPosition?.status)) {
    const operation = getCloseOperation(lastTrend)
    const placeOrderFn = () => placeOrder(operation)

    if (isTp(nextLevel, lastPosition.openLevel)) {
      return closePosition(
        placeOrderFn,
        lastPosition.id,
        PositionClosingRule.TP,
        nextLevel.id,
        nextLevel.id
      )
    }

    if (isSlt50Percent(lastPosition.closingRules, distance)) {
      return closePosition(
        placeOrderFn,
        lastPosition.id,
        PositionClosingRule.SLT_50PERCENT,
        lastPosition.openLevelId
      )
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
      return closePosition(
        placeOrderFn,
        lastPosition.id,
        PositionClosingRule.SLT_3TICKS,
        lastPosition.openLevelId
      )
    }

    // sl
    const positionProfit = getPositionProfit(
      lastPosition.openLevel,
      lastTrend,
      lastPrice
    )
    if (isSl(lastPosition.closingRules, positionProfit, distance)) {
      closePosition(placeOrderFn, lastPosition.id, PositionClosingRule.SL)

      // стоп на коррекции → выключаем движок
      if (isCorrectionTrend(lastTrend)) {
        return store.dispatch(editConfig({ isDisabled: true }))
      }

      // 2 стопа подряд → коррекция
      const positions = selectPositions(state)
      const lastClosedPosition = getLastClosedPosition(positions)

      if (lastClosedPosition?.closedByRule === PositionClosingRule.SL) {
        addCorrectionTrend(lastTrend)
      }
    }
  }
}

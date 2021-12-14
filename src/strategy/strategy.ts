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
import { openPosition, closePosition } from './position'
import { isTradingInterval } from './marketPhase'
import { manageRules, isTp, isSlt50Percent, isSlt3Ticks, isSl } from './rules'
import { addCorrectionTrend } from './trend'
import {
  getLastPrice,
  getPriceDistanceToPrevLevel,
  getPositionProfit,
  isLastPositionClosed,
  isLastPositionOpen,
  getLastClosedPosition,
  isCorrectionTrend,
  isLastLevel,
  getNextLevel,
} from './utils'

export const runStartegy = (ask: number, bid: number) => {
  const state = store.getState()
  const config = selectConfig(state)

  // пропускаем торговлю если движок выключен
  if (config.isDisabled) return

  const date = new Date()
  const lastPosition = selectLastPositionWithLevels(state)

  if (!isTradingInterval(date)) {
    // закрываем позицию по окночании торговой фазы
    if (isLastPositionOpen(lastPosition)) {
      closePosition(lastPosition.id, PositionClosingRule.MARKET_PHASE_END)
    }

    // сбрасываем данные по позициям при закрытии торговой фазы
    if (!!lastPosition) {
      store.dispatch(initPositions([]))
    }

    // пропускаем торговлю вне торговой фазы
    return
  }

  const lastTrend = selectLastTrend(state) // TODO selectOrFail

  if (!lastTrend) {
    throw new Error('Last trend is undefined')
  }

  const levels = selectLevels(state)
  const lastPrice = getLastPrice(ask, bid, lastTrend)
  const distance = getPriceDistanceToPrevLevel(
    levels,
    lastPrice,
    lastPosition?.openLevel,
    lastPosition?.closedLevel
  )

  // менеджерим правила при изменении цены
  manageRules(distance, lastPosition)

  const nextLevel = getNextLevel(levels, lastPrice)

  // открываем новую позицию от следующего уровня если нет открытых позиций
  if (nextLevel && isLastPositionClosed(lastPosition)) {
    if (!nextLevel.isDisabled && !isLastLevel(nextLevel.id, levels)) {
      return openPosition(nextLevel.id)
    }
  }

  // закрываем открытую позицию по tp, slt, sl
  if (isLastPositionOpen(lastPosition)) {
    // tp
    if (isTp(nextLevel)) {
      return closePosition(
        lastPosition.id,
        PositionClosingRule.TP,
        nextLevel.id,
        nextLevel.id
      )
    }

    // slt 50%
    if (isSlt50Percent(lastPosition.closingRules, distance)) {
      return closePosition(
        lastPosition.id,
        PositionClosingRule.SLT_50PERCENT,
        lastPosition.openLevelId
      )
    }

    // slt 3ticks
    if (
      isSlt3Ticks(lastPosition.closingRules, lastPosition.openLevel, lastPrice)
    ) {
      return closePosition(
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
      closePosition(lastPosition.id, PositionClosingRule.SL)

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

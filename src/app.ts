import InvestSDK, {
  CandleResolution,
  Interval,
} from '@tinkoff/invest-openapi-js-sdk'

import store, { editConfig, addCandles } from './store'
import { getOpenPhaseDate } from './date'

const { config } = store.getState()
const api = new InvestSDK(config.api)

const getTickerInfo = async (ticker: string) => {
  const { figi } = await api.searchOne({ ticker })

  store.dispatch(editConfig({ ticker, figi }))
}

const getHistory = async () => {
  const { figi, interval } = store.getState().config
  const date = getOpenPhaseDate()

  const { candles } = await api.candlesGet({
    figi,
    interval: interval as CandleResolution,
    ...date,
  })

  store.dispatch(addCandles(candles))
}

export const watchPrice = () => {
  const { figi, interval } = store.getState().config

  api.candle({ figi, interval: interval as Interval }, (candle) => {
    store.dispatch(addCandles(candle))
  })
}

export const initApp = async () => {
  await api.sandboxClear()

  await getTickerInfo('EQT')

  await getHistory()
}

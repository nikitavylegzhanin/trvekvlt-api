import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import { sub } from 'date-fns'

import store, { editConfig, addCandles } from './store'

const { config } = store.getState()
const api = new InvestSDK(config.api)

const getTickerInfo = async (ticker: string) => {
  store.dispatch(editConfig({ name: 'ticker', value: ticker }))

  const { figi } = await api.searchOne({ ticker: config.ticker })
  store.dispatch(editConfig({ name: 'figi', value: figi }))
}

const getHistory = async () => {
  const { figi } = store.getState().config

  const { candles } = await api.candlesGet({
    figi,
    from: sub(new Date(), { minutes: 10 }).toISOString(),
    to: new Date().toISOString(),
    interval: '1min',
  })

  store.dispatch(addCandles(candles))
}

export const watchPrice = () => {
  const { figi } = store.getState().config

  api.candle({ figi, interval: '1min' }, (candle) => {
    store.dispatch(addCandles(candle))
  })
}

export const initApp = async () => {
  await api.sandboxClear()

  await getTickerInfo('EQT')

  await getHistory()
}

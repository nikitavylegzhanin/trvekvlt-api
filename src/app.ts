import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import reduxDevTools from '@redux-devtools/cli'

import store, { editConfig, addOperations } from './store'
import { getLastTradingSession } from './date'

const { config } = store.getState()
const api = new InvestSDK(config.api)

const getTickerInfo = async (ticker: string) => {
  const { figi } = await api.searchOne({ ticker })

  store.dispatch(editConfig({ ticker, figi }))

  return figi
}

export const initApp = async () => {
  const figi = await getTickerInfo('EQT')
  const date = getLastTradingSession()
  console.log(date)

  const { operations } = await api.operations({
    figi,
    ...date,
  })

  store.dispatch(addOperations(operations))

  api.candle({ figi, interval: '1min' }, (candle) => console.log(candle.time))

  return api
}

export const startReduxDevTool = () =>
  reduxDevTools({ hostname: 'localhost', port: 8000 })

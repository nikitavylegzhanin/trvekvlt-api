import InvestSDK, {
  CandleStreaming,
  CandleStreamingMetaParams,
} from '@tinkoff/invest-openapi-js-sdk'
import { CronJob } from 'cron'
import reduxDevTools from '@redux-devtools/cli'

import store, { editConfig, addOperations } from './store'
import {
  getLastTradingDaySession,
  getLastTradingWeekSession,
  SessionDate,
} from './date'

export const initApp = async () => {
  const { config } = store.getState()
  const api = new InvestSDK(config.api)
  const { figi } = await api.searchOne({ ticker: config.ticker })

  store.dispatch(editConfig({ figi }))

  return api
}

type GetPriceCb = (x: CandleStreaming, m: CandleStreamingMetaParams) => any

export const getPrice = (cb: GetPriceCb) => (api: InvestSDK) => {
  const { figi, interval } = store.getState().config

  return api.candle({ figi, interval }, cb)
}

const getOperations = async (
  api: InvestSDK,
  figi: string,
  date: SessionDate
) => {
  const { operations } = await api.operations({
    figi,
    ...date,
  })

  return store.dispatch(addOperations(operations))
}

export const updatePositions = async (api: InvestSDK) => {
  const { figi } = store.getState().config

  await getOperations(api, figi, getLastTradingWeekSession())

  const { start } = new CronJob(
    '*/30 * * * * *',
    async () => getOperations(api, figi, getLastTradingDaySession()),
    null,
    true,
    undefined,
    undefined,
    true
  )

  return start
}

export const startReduxDevTool = () =>
  reduxDevTools({ hostname: 'localhost', port: 8000 })

import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import { CronJob } from 'cron'
import reduxDevTools from '@redux-devtools/cli'

import store, { editConfig, addOperations } from './store'
import { getLastTradingSession } from './date'

export const initApp = async () => {
  const { config } = store.getState()
  const api = new InvestSDK(config.api)
  const { figi } = await api.searchOne({ ticker: config.ticker })

  store.dispatch(editConfig({ figi }))

  return api
}

export const updatePositions = (api: InvestSDK) => {
  const { start } = new CronJob(
    '*/30 * * * * *',
    async () => {
      const { figi } = store.getState().config
      const date = getLastTradingSession()

      const { operations } = await api.operations({
        figi,
        ...date,
      })

      store.dispatch(addOperations(operations))
    },
    null,
    true
  )

  return start
}

export const startReduxDevTool = () =>
  reduxDevTools({ hostname: 'localhost', port: 8000 })

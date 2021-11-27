import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import reduxDevTools from '@redux-devtools/cli'

import store, { editConfig, changePrice } from './store'

export const initApp = async () => {
  const { config } = store.getState()
  const api = new InvestSDK(config.api)
  const { figi } = await api.searchOne({ ticker: config.ticker })

  store.dispatch(editConfig({ figi }))

  return api
}

export const subscribePrice = (api: InvestSDK) => {
  const { figi } = store.getState().config

  return api.orderbook({ figi, depth: 1 }, ({ asks, bids }) =>
    store.dispatch(changePrice({ ask: asks[0][0], bid: bids[0][0] }))
  )
}

export const startReduxDevTool = () =>
  reduxDevTools({ hostname: 'localhost', port: 8000 })

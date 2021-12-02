import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import reduxDevTools from '@redux-devtools/cli'
import { or } from 'ramda'

import store from './store'
import { selectConfig, editConfig } from './store/config'
import { changePrice, selectPrice } from './store/price'

export const initApp = async () => {
  const config = selectConfig(store.getState())
  const api = new InvestSDK(config.api)
  const { figi } = await api.searchOne({ ticker: config.ticker })

  store.dispatch(editConfig({ figi }))

  return api
}

export const subscribePrice = (api: InvestSDK) => {
  const state = store.getState()
  const { figi } = selectConfig(state)
  const price = selectPrice(state)

  let ask = price.ask
  let bid = price.bid

  return api.orderbook({ figi, depth: 1 }, ({ asks, bids }) => {
    const [lastAsk] = asks[0]
    const [lastBid] = bids[0]

    if (or(ask !== lastAsk, bid !== lastBid)) {
      ask = lastAsk
      bid = lastBid

      return store.dispatch(changePrice({ ask: asks[0][0], bid: bids[0][0] }))
    }
  })
}

export const startReduxDevTool = () =>
  reduxDevTools({ hostname: 'localhost', port: 8000 })

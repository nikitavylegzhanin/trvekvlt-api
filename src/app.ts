import InvestSDK from '@tinkoff/invest-openapi-js-sdk'

import store, { editConfig } from './store'

const { config } = store.getState()
const api = new InvestSDK(config.api)

const getTickerInfo = async (ticker: string) => {
  const { figi } = await api.searchOne({ ticker })

  store.dispatch(editConfig({ ticker, figi }))
}

export const initApp = async () => {
  await getTickerInfo('EQT')

  return api
}

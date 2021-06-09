import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import { startOfToday, endOfToday } from 'date-fns'

import config from './config'

const api = new InvestSDK(config.api)

const { figi } = await api.searchOne({ ticker: config.ticker })

const { candles } = await api.candlesGet({
  figi,
  from: startOfToday().toISOString(),
  to: endOfToday().toISOString(),
  interval: 'hour',
})

console.log(candles[candles.length - 1])

// api.candle({ figi }, (candle) => {
//   console.log(candle)
// })

// api.orderbook({ figi, depth: 10 }, (data) => {
//   console.log(data)
// })

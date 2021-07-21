import InvestSDK, { CandleStreaming } from '@tinkoff/invest-openapi-js-sdk'
import { sub, parseISO, format } from 'date-fns'
import { plot as chart, red, green } from 'asciichart'

import config from './config'

const api = new InvestSDK(config.api)
await api.sandboxClear()

const { figi, currency } = await api.searchOne({ ticker: config.ticker })

// get init candles
const { candles: initCandles } = await api.candlesGet({
  figi,
  from: sub(new Date(), { minutes: 10 }).toISOString(),
  to: new Date().toISOString(),
  interval: '1min',
})

const candles: CandleStreaming[] = initCandles
let max = Math.max(...candles.map(({ o }) => o))

api.candle({ figi, interval: '1min' }, (candle) => {
  if (candles.findIndex(({ time }) => time === candle.time) === -1) {
    candles.push(candle)

    if (candles.length) {
      const data = candles.map((candle) => candle.o)

      console.log(
        chart([data.map(() => max), data], {
          padding: '',
          offset: 2,
          height: 6,
          colors: [red, undefined, green],
        })
      )

      console.log(
        '\n',
        format(parseISO(candle.time), 'k:mm'),
        `Price: ${candle.o} ${currency}`,
        '\n'
      )

      if (candle.o > max) {
        console.log('New maximum')

        max = candle.o
      }
    }
  }

  return true
})

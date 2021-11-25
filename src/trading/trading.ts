import {
  CandleStreaming,
  CandleStreamingMetaParams,
} from '@tinkoff/invest-openapi-js-sdk'
import { parseISO, format } from 'date-fns'

export const trade = async (
  { time, o, v }: CandleStreaming,
  _: CandleStreamingMetaParams
) => {
  console.log(format(parseISO(time), 'HH:mm:ss:SS'), o, v)
}

import { last, pathOr } from 'ramda'

export const parseBotId = (data: string) => parseInt(last(data.split(':')))

export const getBotId = pathOr<number>(0, ['botId'])

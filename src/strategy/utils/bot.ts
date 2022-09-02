import { compose, propEq, not } from 'ramda'

import { BotStatus } from '../../db'
import { StoredBot } from '../../store/bots/reducer'

export const getBotById = (bots: StoredBot[], botId: StoredBot['id']) =>
  bots.find(propEq('id', botId))

export const isBotDisabled = compose(not, propEq('status', BotStatus.RUNNING))

export const getUnsubscribeFigi = (
  bots: StoredBot[],
  botId: StoredBot['id']
) => {
  const bot = getBotById(bots, botId)

  if (!bot) return undefined

  return bots.filter(propEq('figi', bot.figi)).length === 1
    ? bot.figi
    : undefined
}

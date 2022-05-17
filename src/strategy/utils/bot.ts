import { compose, propEq, not } from 'ramda'

import { BotStatus } from '../../db'
import { StoredBot } from '../../store/bots/reducer'

export const getBotById = (bots: StoredBot[], botId: StoredBot['id']) =>
  bots.find(propEq('id', botId))

export const isBotDisabled = compose(not, propEq('status', BotStatus.RUNNING))

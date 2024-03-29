import {
  TrendDirection,
  TrendType,
  LevelStatus,
  BotStatus,
  Level,
  Trend,
} from '../db'
import { StoredBot } from '../store/bots'

const date = new Date()

export const getTestLevels = (values: number[]): Level[] =>
  values.map((value, index) => ({
    value,
    id: index + 1,
    status: LevelStatus.ACTIVE,
    createdAt: date,
    updatedAt: date,
    bot: null,
  }))

export const getTestTrend = (
  isDowntrend?: boolean,
  isCorrection?: boolean
): Trend => ({
  id: 0,
  direction: isDowntrend ? TrendDirection.DOWN : TrendDirection.UP,
  type: isCorrection ? TrendType.CORRECTION : TrendType.MANUAL,
  createdAt: date,
  updatedAt: date,
  bot: null,
})

export const getTestBot = (
  levelValues?: number[],
  isDowntrend?: boolean,
  isCorrection?: boolean,
  tickValue = 0.01,
  kLong = 1,
  kShort = 1
): StoredBot => ({
  id: 0,
  accountId: '0',
  uid: '0',
  status: BotStatus.RUNNING,
  startDate: new Date(2021, 11, 31, 10, 0, 0),
  endDate: new Date(2021, 11, 31, 18, 40, 0),
  levels: levelValues ? getTestLevels(levelValues) : [],
  trends: [getTestTrend(isDowntrend, isCorrection)],
  positions: [],
  createdAt: date,
  updatedAt: date,
  name: 'test',
  ticker: 'TEST',
  figi: 't3st',
  isShortEnable: true,
  tickValue,
  isProcessing: false,
  exchange: 'test',
  isTradeAvailable: true,
  kLong,
  kShort,
  maxVolume: 1,
  currency: 'test',
})

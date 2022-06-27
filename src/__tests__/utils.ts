import {
  TrendDirection,
  TrendType,
  LevelStatus,
  InstrumentType,
  BotStatus,
  Level,
  Trend,
  OrderType,
  OrderDirection,
} from '../db'
import { StoredBot } from '../store/bots'
import { PlacedOrder } from '../api'

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
  isCorrection?: boolean
): StoredBot => ({
  id: 0,
  status: BotStatus.RUNNING,
  startDate: new Date(2021, 11, 31, 10, 0, 0),
  endDate: new Date(2021, 11, 31, 18, 40, 0),
  levels: levelValues ? getTestLevels(levelValues) : [],
  trends: [getTestTrend(isDowntrend, isCorrection)],
  positions: [],
  createdAt: date,
  updatedAt: date,
  accountId: '0',
  name: 'test',
  ticker: 'TEST',
  figi: 't3st',
  instrumentType: InstrumentType.SHARE,
  isShortEnable: true,
  tickValue: 0.01,
})

export const mockPrice = (
  price: number
): [number, (direction: 1 | 2, quantity: number) => Promise<PlacedOrder>] => [
  price,
  jest.fn(
    (direction: 1 | 2, quantity = 1) =>
      new Promise<PlacedOrder>((resolve) =>
        resolve({
          price,
          currency: 'USD',
          quantity,
          direction: direction === 1 ? OrderDirection.BUY : OrderDirection.SELL,
          type: OrderType.MARKET,
        })
      )
  ),
]

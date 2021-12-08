import InvestSDK from '@tinkoff/invest-openapi-js-sdk'
import reduxDevTools from '@redux-devtools/cli'
import { Connection } from 'typeorm'
import { pick, not, isNil, pipe, reduce, filter, uniq, without } from 'ramda'

import store from './store'
import { initLevels, addLevels } from './store/levels'
import { initTrends } from './store/trends'
import { initPositions } from './store/positions'
import { Level, Trend, Position } from './db'
import { selectConfig, editConfig } from './store/config'
import { changePrice, selectPrice } from './store/price'

const getRelatedLevels = pipe(
  reduce<Position, Level[]>(
    (arr, position) => [...arr, position.openLevel, position.closedLevel],
    []
  ),
  filter(pipe(isNil, not)),
  uniq
)

export const initApp = async ({ manager }: Connection) => {
  const config = selectConfig(store.getState())
  const api = new InvestSDK(config.api)
  const { figi } = await api.searchOne({ ticker: config.ticker })

  store.dispatch(editConfig({ figi }))

  // Init levels, trends, positions
  const levels = await manager.find(Level)
  store.dispatch(initLevels(levels.map(pick(['id', 'value']))))

  const trends = await manager.find(Trend)
  store.dispatch(initTrends(trends.map(pick(['id', 'direction', 'type']))))

  const positions = await manager.find(Position, {
    relations: ['openLevel', 'closedLevel'],
  })
  store.dispatch(
    initPositions(
      positions.map((position) => ({
        ...pick(['id', 'closingRules', 'closedByRule'], position),
        openLevelId: position.openLevel?.id,
        closedLevelId: position.closedLevel?.id,
      }))
    )
  )

  // Add related levels if not loaded
  const relatedLevels = without(levels, getRelatedLevels(positions))
  if (relatedLevels.length) {
    store.dispatch(addLevels(relatedLevels.map(pick(['id', 'value']))))
  }

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

    if (ask !== lastAsk || bid !== lastBid) {
      ask = lastAsk
      bid = lastBid

      return store.dispatch(changePrice({ ask: asks[0][0], bid: bids[0][0] }))
    }
  })
}

export const startReduxDevTool = () =>
  reduxDevTools({ hostname: 'localhost', port: 8000 })

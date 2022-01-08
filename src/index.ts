import { connect } from './db'
import { initApp, subscribePrice, startReduxDevTool } from './app'

console.log('Test env TICKER', process.env.TICKER)

connect()
  .then(initApp)
  .then(subscribePrice)
  .then(startReduxDevTool)
  .catch(console.error)

import { connect, close } from './db'
import { initApp, subscribePrice, startReduxDevTool } from './app'

connect()
  .then(initApp)
  .then(subscribePrice)
  .then(startReduxDevTool)
  .catch(console.error)

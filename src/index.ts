import db from './db'
import { initApp, subscribePrice, startReduxDevTool } from './app'

db.connect()
  .then(initApp)
  .then(subscribePrice)
  .then(startReduxDevTool)
  .catch(console.error)

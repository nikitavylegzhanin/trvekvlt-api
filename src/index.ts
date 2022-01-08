import { connect } from './db'
import { initApp, subscribePrice, startReduxDevTool } from './app'

console.log(process.env.WEBSITE_HOSTNAME, process.env.PORT)

connect()
  .then(initApp)
  .then(subscribePrice)
  .then(startReduxDevTool)
  .catch(console.error)

import { connect } from './db'
import { initApp, subscribePrice } from './app'
import { startServer, logUrl } from './server'

connect()
  .then(initApp)
  .then(subscribePrice)
  .then(startServer)
  .then(logUrl)
  .catch(console.error)

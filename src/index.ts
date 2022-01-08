import { connect } from './db'
import { initApp, subscribePrice } from './app'
import { startServer } from './server'

connect()
  .then(initApp)
  .then(subscribePrice)
  .then(startServer)
  .then(({ url }) => console.log(`Server ready at ${url}`))
  .catch(console.error)

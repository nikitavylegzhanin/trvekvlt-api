import { connect } from './db'
import { init, run } from './app'
import { startServer, logUrl } from './server'

connect()
  .then(init)
  .then(run)
  .then(startServer)
  .then(logUrl)
  .catch(console.error)

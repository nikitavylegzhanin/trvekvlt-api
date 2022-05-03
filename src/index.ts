import { connect } from './db'
import { getBots, run } from './app'
import { startServer, logUrl } from './server'

connect()
  .then(getBots)
  .then((bots) => Promise.all(bots.map(run)))
  .then(startServer)
  .then(logUrl)
  .catch(console.error)

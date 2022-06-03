import db from './db'
import { getBots, run } from './app'
import { startServer, logUrl } from './server'

db.initialize()
  .then(getBots)
  .then((bots) => Promise.all(bots.map(run)))
  .then(startServer)
  .then(logUrl)
  .catch(console.error)

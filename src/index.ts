import db from './db'
import { init, run } from './app'
import { startServer, logUrl } from './server'

db.initialize()
  .then(init)
  .then(run)
  .then(startServer)
  .then(logUrl)
  .catch(console.error)

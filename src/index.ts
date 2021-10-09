import { initApp } from './app'
import { getPositions } from './positions'
import { toTable } from './table'

initApp()
  .then(getPositions)
  .then(toTable)
  .then(console.log)
  .catch(console.error)

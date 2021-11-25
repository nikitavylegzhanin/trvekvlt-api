import {
  initApp,
  // updatePositions,
  getPrice,
  startReduxDevTool,
} from './app'
import { trade } from './trading'
// import { getWeeklyReport } from './report'

initApp()
  .then(getPrice(trade))
  // .then(updatePositions)
  // .then(getWeeklyReport)
  // .then(console.log)
  .then(startReduxDevTool)
  .catch(console.error)

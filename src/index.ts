import {
  initApp,
  updatePositions,
  // startReduxDevTool
} from './app'
import { getWeeklyReport } from './report'

initApp()
  .then(updatePositions)
  .then(getWeeklyReport)
  .then(console.log)
  // .then(startReduxDevTool)
  .catch(console.error)

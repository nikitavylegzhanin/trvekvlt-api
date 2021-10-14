import { initApp, updatePositions, startReduxDevTool } from './app'

initApp().then(updatePositions).then(startReduxDevTool).catch(console.error)

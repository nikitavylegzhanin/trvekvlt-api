import { initApp, startReduxDevTool } from './app'

initApp().then(startReduxDevTool).catch(console.error)

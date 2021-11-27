import { initApp, subscribePrice, startReduxDevTool } from './app'

initApp().then(subscribePrice).then(startReduxDevTool).catch(console.error)

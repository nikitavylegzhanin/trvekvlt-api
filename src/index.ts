import { initApp, watchPrice } from './app'

initApp().then(watchPrice).catch(console.error)

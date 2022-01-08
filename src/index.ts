import { connect } from './db'
import { initApp, subscribePrice } from './app'

connect().then(initApp).then(subscribePrice).catch(console.error)

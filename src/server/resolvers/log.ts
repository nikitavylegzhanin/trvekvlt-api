import db, { Log } from '../../db'

export const log = () => db.manager.find(Log)

import { createReducer } from '@reduxjs/toolkit'

export type Level = {
  id: string
  value: number
}

const initLevels: Level[] = [
  { id: '1', value: 20.91 },
  { id: '2', value: 21.13 },
  { id: '3', value: 21.34 },
  { id: '4', value: 21.48 },
]

const reducer = createReducer(initLevels, (builder) => builder)

export default reducer

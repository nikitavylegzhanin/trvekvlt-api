import { createAction } from '@reduxjs/toolkit'

export enum PriceActionTypes {
  CHANGE_PRICE = 'Price/CHANGE_PRICE',
}

type PricePayload = {
  ask: number
  bid: number
}

export const changePrice = createAction<
  PricePayload,
  PriceActionTypes.CHANGE_PRICE
>(PriceActionTypes.CHANGE_PRICE)

import { createAction } from '@reduxjs/toolkit'

import { Price } from './reducer'

export enum PriceActionTypes {
  CHANGE_PRICE = 'Price/CHANGE_PRICE',
}

export const changePrice = createAction<Price, PriceActionTypes.CHANGE_PRICE>(
  PriceActionTypes.CHANGE_PRICE
)

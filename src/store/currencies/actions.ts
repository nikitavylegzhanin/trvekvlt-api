import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import { StoredCurrency } from './reducer'

export enum AccountActionType {
  INIT = 'Currency/INIT',
}

export const initCurrencies: ActionCreatorWithPayload<
  StoredCurrency[],
  AccountActionType.INIT
> = createAction(AccountActionType.INIT)

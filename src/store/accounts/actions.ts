import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import { StoredAccount } from './reducer'

export enum AccountActionType {
  INIT = 'Account/INIT',
}

export const initAccounts: ActionCreatorWithPayload<
  StoredAccount[],
  AccountActionType.INIT
> = createAction(AccountActionType.INIT)

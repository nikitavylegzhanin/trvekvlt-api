import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import { EditableConfigParams } from './reducer'

export enum ConfigActionType {
  EDIT = 'Config/EDIT',
}

export type EditConfigPayload = Partial<EditableConfigParams>
export const editConfig: ActionCreatorWithPayload<
  EditConfigPayload,
  ConfigActionType.EDIT
> = createAction(ConfigActionType.EDIT)

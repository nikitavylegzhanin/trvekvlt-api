import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import { EditableConfigParams } from './reducer'

enum ConfigActionType {
  EDIT = 'Config/EDIT',
}

type EditConfigPayload = Partial<EditableConfigParams>
export const editConfig: ActionCreatorWithPayload<
  EditConfigPayload,
  ConfigActionType.EDIT
> = createAction(ConfigActionType.EDIT)

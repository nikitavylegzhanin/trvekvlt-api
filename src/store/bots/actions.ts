import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import { StoredBot } from './reducer'

export enum BotActionType {
  INIT = 'Bot/INIT',
  ADD = 'Bot/ADD',
  EDIT = 'Bot/EDIT',
  ADD_DATA = 'Bot/ADD_DATA',
  EDIT_DATA = 'Bot/EDIT_DATA',
  REMOVE_DATA = 'Bot/REMOVE_DATA',
}

export const initBots: ActionCreatorWithPayload<
  StoredBot[],
  BotActionType.INIT
> = createAction(BotActionType.INIT)

export const addBot: ActionCreatorWithPayload<StoredBot, BotActionType.ADD> =
  createAction(BotActionType.ADD)

export const editBot: ActionCreatorWithPayload<
  Partial<StoredBot>,
  BotActionType.EDIT
> = createAction(BotActionType.EDIT)

type AddDataPayload = {
  botId: StoredBot['id']
  level?: StoredBot['levels'][0]
  position?: StoredBot['positions'][0]
  trend?: StoredBot['trends'][0]
}

export const addData: ActionCreatorWithPayload<
  AddDataPayload,
  BotActionType.ADD_DATA
> = createAction(BotActionType.ADD_DATA)

type EditDataPayload = {
  botId: StoredBot['id']
  level?: Partial<StoredBot['levels'][0]>
  position?: Partial<StoredBot['positions'][0]>
  trend?: Partial<StoredBot['trends'][0]>
}

export const editData: ActionCreatorWithPayload<
  EditDataPayload,
  BotActionType.EDIT_DATA
> = createAction(BotActionType.EDIT_DATA)

export const removeData: ActionCreatorWithPayload<
  EditDataPayload,
  BotActionType.REMOVE_DATA
> = createAction(BotActionType.REMOVE_DATA)

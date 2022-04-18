import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'
import { Operation } from '@tinkoff/invest-openapi-js-sdk'

import { Level } from './Level'

export enum PositionStatus {
  OPENING = 'OPENING',
  OPEN_PARTIAL = 'OPEN_PARTIAL',
  OPEN_FULL = 'OPEN_FULL',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

export enum PositionClosingRule {
  SL = 'SL',
  TP = 'TP',
  SLT_3TICKS = 'SLT_3TICKS',
  SLT_50PERCENT = 'SLT_50PERCENT',
  MARKET_PHASE_END = 'MARKET_PHASE_END',
  TIME_BREAK = 'TIME_BREAK',
}

export const DEFAULT_CLOSING_RULES = [
  PositionClosingRule.SL,
  PositionClosingRule.TP,
  PositionClosingRule.MARKET_PHASE_END,
]

export enum PositionOpeningRule {
  BEFORE_LEVEL_3TICKS = 'BEFORE_LEVEL_3TICKS',
  ON_LEVEL = 'ON_LEVEL',
  AFTER_LEVEL_3TICKS = 'AFTER_LEVEL_3TICKS',
}

@Entity()
export class Position {
  @PrimaryGeneratedColumn()
  id: number

  @Column('enum', { enum: PositionStatus, default: PositionStatus.OPENING })
  status: PositionStatus

  @Column('enum', { enum: PositionOpeningRule, array: true, default: [] })
  openedByRules: PositionOpeningRule[]

  @Column('jsonb', { array: false, default: () => "'[]'" })
  operations: Operation[]

  @Column('enum', {
    enum: PositionClosingRule,
    array: true,
    default: DEFAULT_CLOSING_RULES,
  })
  closingRules: PositionClosingRule[]

  @Column('enum', { enum: PositionClosingRule, nullable: true })
  closedByRule?: PositionClosingRule

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Level, (level) => level.openPositions)
  openLevel: Level

  @ManyToOne(() => Level, (level) => level.closedPositions)
  closedLevel?: Level
}

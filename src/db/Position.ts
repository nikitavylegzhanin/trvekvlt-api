import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'
import { always } from 'ramda'

import { Level } from './Level'

export enum PositionStatus {
  OPENING,
  OPEN,
  CLOSED,
}

export enum PositionClosingRule {
  SL,
  TP,
  SLT_3TICKS,
  SLT_50PERCENT,
  MARKET_PHASE_END,
}

export const DEFAULT_CLOSING_RULES = [
  PositionClosingRule.SL,
  PositionClosingRule.TP,
  PositionClosingRule.MARKET_PHASE_END,
]

@Entity()
export class Position {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int', {
    default: PositionStatus.OPEN,
    transformer: {
      from: (value: number) => PositionStatus[value],
      to: always,
    },
  })
  status: PositionStatus

  @Column('text', {
    default: JSON.stringify(DEFAULT_CLOSING_RULES),
    transformer: {
      from: JSON.parse,
      to: JSON.stringify,
    },
  })
  closingRules: PositionClosingRule[]

  @Column('int', {
    nullable: true,
    transformer: {
      from: (value: number) => PositionClosingRule[value],
      to: always,
    },
  })
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

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'

import { Level } from './Level'

export enum PositionStatus {
  OPENING,
  OPEN,
  CLOSING,
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

  @Column('enum', { enum: PositionStatus })
  status: PositionStatus

  @Column('enum', {
    enum: PositionClosingRule,
    array: true,
    default: DEFAULT_CLOSING_RULES,
  })
  closingRules: PositionClosingRule[]

  @Column('enum', { enum: PositionClosingRule })
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

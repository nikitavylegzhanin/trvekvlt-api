import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { Order, OrderRule } from './Order'
import { Level } from './Level'
import { Bot } from './Bot'

export enum PositionStatus {
  OPENING = 'OPENING',
  OPEN_PARTIAL = 'OPEN_PARTIAL',
  OPEN_FULL = 'OPEN_FULL',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

export const DEFAULT_AVAILABLE_RULES = [
  OrderRule.OPEN_BEFORE_LEVEL_3TICKS,
  OrderRule.OPEN_ON_LEVEL,
  OrderRule.OPEN_AFTER_LEVEL_3TICKS,
  OrderRule.CLOSE_BY_SL,
  OrderRule.CLOSE_BY_TP,
  OrderRule.CLOSE_BY_MARKET_PHASE_END,
]

@Entity()
export class Position {
  @PrimaryGeneratedColumn()
  id: number

  @Column('enum', { enum: PositionStatus, default: PositionStatus.OPENING })
  status: PositionStatus

  @Column('enum', {
    enum: OrderRule,
    array: true,
    default: DEFAULT_AVAILABLE_RULES,
  })
  availableRules: OrderRule[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Level, (level) => level.openPositions)
  openLevel: Level

  @ManyToOne(() => Level, (level) => level.closedPositions)
  closedLevel?: Level

  @ManyToOne(() => Bot, (bot) => bot.positions)
  bot: Bot

  @OneToMany(() => Order, (order) => order.position)
  orders: Order[]
}

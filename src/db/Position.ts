import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'

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
registerEnumType(PositionStatus, { name: 'PositionStatus' })

export const DEFAULT_AVAILABLE_RULES = [
  OrderRule.OPEN_BEFORE_LEVEL_3TICKS,
  OrderRule.OPEN_ON_LEVEL,
  OrderRule.OPEN_AFTER_LEVEL_3TICKS,
  OrderRule.CLOSE_BY_SL,
  OrderRule.CLOSE_BY_TP,
  OrderRule.CLOSE_BY_MARKET_PHASE_END,
]

@Entity()
@ObjectType()
export class Position {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => PositionStatus)
  @Column('enum', { enum: PositionStatus, default: PositionStatus.OPENING })
  status: PositionStatus

  @Field(() => [OrderRule])
  @Column('enum', {
    enum: OrderRule,
    array: true,
    default: DEFAULT_AVAILABLE_RULES,
  })
  availableRules: OrderRule[]

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date

  @Field(() => Level)
  @ManyToOne(() => Level, (level) => level.openPositions)
  openLevel: Level

  @Field(() => Level)
  @ManyToOne(() => Level, (level) => level.closedPositions)
  closedLevel?: Level

  @Field(() => Bot)
  @ManyToOne(() => Bot, (bot) => bot.positions)
  bot: Bot

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.position)
  orders: Order[]
}

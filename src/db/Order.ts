import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'
import {
  ObjectType,
  Field,
  ID,
  registerEnumType,
  Float,
  Int,
} from 'type-graphql'

import { Position } from './Position'

export enum OrderDirection {
  BUY = 'BUY',
  SELL = 'SELL',
}
registerEnumType(OrderDirection, { name: 'OrderDirection' })

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}
registerEnumType(OrderType, { name: 'OrderType' })

export enum OrderRule {
  OPEN_BEFORE_LEVEL_3TICKS = 'OPEN_BEFORE_LEVEL_3TICKS',
  OPEN_ON_LEVEL = 'OPEN_ON_LEVEL',
  OPEN_AFTER_LEVEL_3TICKS = 'OPEN_AFTER_LEVEL_3TICKS',
  CLOSE_BY_SL = 'CLOSE_BY_SL',
  CLOSE_BY_TP = 'CLOSE_BY_TP',
  CLOSE_BY_SLT_3TICKS = 'CLOSE_BY_SLT_3TICKS',
  CLOSE_BY_SLT_50PERCENT = 'CLOSE_BY_SLT_50PERCENT',
  CLOSE_BY_MARKET_PHASE_END = 'CLOSE_BY_MARKET_PHASE_END',
}
registerEnumType(OrderRule, { name: 'OrderRule' })

@Entity()
@ObjectType()
export class Order {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => Float)
  @Column('real')
  price: number

  @Field(() => String)
  @Column()
  currency: string

  @Field(() => Int)
  @Column('integer')
  quantity: number

  @Field(() => OrderDirection)
  @Column('enum', { enum: OrderDirection })
  direction: OrderDirection

  @Field(() => OrderType)
  @Column('enum', { enum: OrderType })
  type: OrderType

  @Field(() => OrderRule)
  @Column('enum', { enum: OrderRule })
  rule: OrderRule

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date

  @Field(() => Position)
  @ManyToOne(() => Position, (position) => position.orders)
  position: Position
}

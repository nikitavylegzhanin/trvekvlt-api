import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'

import { Position } from './Position'

export enum OrderDirection {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

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

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number

  @Column('real')
  price: number

  @Column()
  currency: string

  @Column('integer')
  quantity: number

  @Column('enum', { enum: OrderDirection })
  direction: OrderDirection

  @Column('enum', { enum: OrderType })
  type: OrderType

  @Column('enum', { enum: OrderRule })
  rule: OrderRule

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Position, (position) => position.orders)
  position: Position
}

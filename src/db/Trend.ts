import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'

import { Bot } from './Bot'

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}
registerEnumType(TrendDirection, { name: 'TrendDirection' })

export enum TrendType {
  MANUAL = 'MANUAL',
  CORRECTION = 'CORRECTION',
}
registerEnumType(TrendType, { name: 'TrendType' })

@Entity()
@ObjectType()
export class Trend {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => TrendDirection)
  @Column('enum', { enum: TrendDirection })
  direction: TrendDirection

  @Field(() => TrendType)
  @Column('enum', { enum: TrendType, default: TrendType.MANUAL })
  type: TrendType

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date

  @Field(() => Bot)
  @ManyToOne(() => Bot, (bot) => bot.trends)
  bot: Bot
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm'
import { ObjectType, Field, ID, registerEnumType, Float } from 'type-graphql'

import { Position } from './Position'
import { Bot } from './Bot'

export enum LevelStatus {
  ACTIVE = 'ACTIVE',
  DISABLED_DURING_SESSION = 'DISABLED_DURING_SESSION',
  DISABLED = 'DISABLED',
}
registerEnumType(LevelStatus, { name: 'LevelStatus' })

@Entity()
@ObjectType()
export class Level {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => Float)
  @Column('real')
  value: number

  @Field(() => LevelStatus)
  @Column('enum', { enum: LevelStatus, default: LevelStatus.ACTIVE })
  status: LevelStatus

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date

  @Field(() => [Position])
  @OneToMany(() => Position, (position) => position.openLevel)
  openPositions?: Position[]

  @Field(() => [Position])
  @OneToMany(() => Position, (position) => position.closedLevel)
  closedPositions?: Position[]

  @Field(() => Bot)
  @ManyToOne(() => Bot, (bot) => bot.levels)
  bot: Bot
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'

import { Level } from './Level'
import { Position } from './Position'
import { Trend } from './Trend'

export enum InstrumentType {
  FUTURE = 'future',
  SHARE = 'share',
}

registerEnumType(InstrumentType, { name: 'InstrumentType' })

export enum BotStatus {
  RUNNING = 'RUNNING',
  DISABLED_DURING_SESSION = 'DISABLED_DURING_SESSION',
  DISABLED = 'DISABLED',
}

registerEnumType(BotStatus, { name: 'BotStatus' })

@Entity()
@ObjectType()
export class Bot {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => String)
  @Column()
  accountId: string

  @Field(() => String)
  @Column()
  name: string

  @Field(() => String)
  @Column()
  ticker: string

  @Field(() => InstrumentType)
  @Column('enum', { enum: InstrumentType })
  instrumentType: InstrumentType

  @Field(() => BotStatus)
  @Column('enum', { enum: BotStatus, default: BotStatus.RUNNING })
  status: BotStatus

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date

  @Field(() => [Level], { nullable: true })
  @OneToMany(() => Level, (level) => level.bot)
  levels: Level[]

  @Field(() => [Position], { nullable: true })
  @OneToMany(() => Position, (position) => position.bot)
  positions: Position[]

  @Field(() => [Trend], { nullable: true })
  @OneToMany(() => Trend, (trend) => trend.bot)
  trends: Trend[]
}

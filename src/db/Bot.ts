import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { ObjectType, Field, ID, registerEnumType, Float } from 'type-graphql'

import { Level } from './Level'
import { Position } from './Position'
import { Trend } from './Trend'
import { Log } from './Log'

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
  uid: string

  @Field(() => Float)
  @Column('real')
  maxVolume: number

  @Field(() => String)
  @Column()
  name: string

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

  @Field(() => [Log], { nullable: true })
  @OneToMany(() => Log, (log) => log.bot)
  log?: Log[]
}

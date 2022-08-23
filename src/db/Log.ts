import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  ManyToOne,
} from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'

import { Bot } from './Bot'

@Entity()
@ObjectType()
export class Log {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => String)
  @Column()
  message: string

  @ManyToOne(() => Bot, (bot) => bot.log)
  bot: Bot

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date
}

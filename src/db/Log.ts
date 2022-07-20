import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'

export enum LogType {
  ERROR = 'ERROR',
  STATE = 'STATE',
}
registerEnumType(LogType, { name: 'LogType' })

@Entity()
@ObjectType()
export class Log {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => LogType)
  @Column('enum', { enum: LogType })
  type: LogType

  @Field(() => String)
  @Column()
  message: string

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date
}

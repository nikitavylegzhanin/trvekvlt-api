import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

export enum LogType {
  ERROR = 'ERROR',
  STATE = 'STATE',
}

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number

  @Column('enum', { enum: LogType })
  type: LogType

  @Column()
  message: string

  @CreateDateColumn()
  createdAt: Date
}

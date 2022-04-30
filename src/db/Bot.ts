import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'

import { Level } from './Level'
import { Position } from './Position'
import { Trend } from './Trend'

enum InstrumentType {
  FUTURE = 'future',
  SHARE = 'share',
}

@Entity()
export class Bot {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  accountId: string

  @Column()
  name: string

  @Column()
  ticker: string

  @Column('enum', { enum: InstrumentType })
  instrumentType: InstrumentType

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Level, (level) => level.bot)
  levels: Level[]

  @OneToMany(() => Position, (position) => position.bot)
  positions: Position[]

  @OneToMany(() => Trend, (trend) => trend.bot)
  trends: Trend[]
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm'

import { Position } from './Position'
import { Bot } from './Bot'

export enum LevelStatus {
  ACTIVE = 'ACTIVE',
  DISABLED_DURING_SESSION = 'DISABLED_DURING_SESSION',
  DISABLED = 'DISABLED',
}

@Entity()
export class Level {
  @PrimaryGeneratedColumn()
  id: number

  @Column('real')
  value: number

  @Column('enum', { enum: LevelStatus, default: LevelStatus.ACTIVE })
  status: LevelStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Position, (position) => position.openLevel)
  openPositions?: Position[]

  @OneToMany(() => Position, (position) => position.closedLevel)
  closedPositions?: Position[]

  @ManyToOne(() => Bot, (bot) => bot.levels)
  bot: Bot
}

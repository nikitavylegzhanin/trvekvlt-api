import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'

import { Position } from './Position'

@Entity()
export class Level {
  @PrimaryGeneratedColumn()
  id: number

  @Column('real')
  value: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Position, (position) => position.openLevel)
  openPositions?: Position[]

  @OneToMany(() => Position, (position) => position.closedLevel)
  closedPositions?: Position[]
}

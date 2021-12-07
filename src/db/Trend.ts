import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { always } from 'ramda'

export enum TrendDirection {
  UP,
  DOWN,
}

export enum TrendType {
  MANUAL,
  CORRECTION,
}

@Entity()
export class Trend {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int', {
    transformer: {
      from: (value) => TrendDirection[value],
      to: always,
    },
  })
  direction: TrendDirection

  @Column('int', {
    transformer: {
      from: (value) => TrendType[value],
      to: always,
    },
  })
  type: TrendType

  @CreateDateColumn()
  createdAd: Date

  @UpdateDateColumn()
  updatedAt: Date
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

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

  @Column('enum', { enum: TrendDirection })
  direction: TrendDirection

  @Column('enum', { enum: TrendType })
  type: TrendType

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

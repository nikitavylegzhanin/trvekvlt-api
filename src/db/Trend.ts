import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum TrendType {
  MANUAL = 'MANUAL',
  CORRECTION = 'CORRECTION',
}

@Entity()
export class Trend {
  @PrimaryGeneratedColumn()
  id: number

  @Column('enum', { enum: TrendDirection })
  direction: TrendDirection

  @Column('enum', { enum: TrendType, default: TrendType.MANUAL })
  type: TrendType

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

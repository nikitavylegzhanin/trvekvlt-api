import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  message: string

  @CreateDateColumn()
  createdAt: Date
}

import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('daily_limits')
export class DailyLimit {
  @PrimaryColumn()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  spent: number;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;
}

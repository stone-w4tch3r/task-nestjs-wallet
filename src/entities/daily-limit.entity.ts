import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { BaseEntity } from 'typeorm';
import { NumericColumnTransformer } from '../common/transformers/numeric-column.transformer.js';

@Entity('daily_limits')
export class DailyLimit extends BaseEntity {
  @PrimaryColumn()
  userId!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new NumericColumnTransformer(),
  })
  spent!: number;

  @Column({ type: 'date' })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

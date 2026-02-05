import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from 'typeorm';
import { NumericColumnTransformer } from '../common/transformers/numeric-column.transformer.js';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new NumericColumnTransformer(),
  })
  balance!: number;

  @CreateDateColumn()
  createdAt!: Date;
}

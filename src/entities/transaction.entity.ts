import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity.js';

export enum TransactionType {
  TOPUP = 'TOPUP',
  CHARGE = 'CHARGE',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column()
  walletId!: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  reason!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

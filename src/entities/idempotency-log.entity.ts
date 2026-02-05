import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { BaseEntity } from 'typeorm';

@Entity('idempotency_logs')
export class IdempotencyLog extends BaseEntity {
  @PrimaryColumn()
  key!: string;

  @Column({ type: 'json' })
  response!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}

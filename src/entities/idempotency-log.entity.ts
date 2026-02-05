import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('idempotency_logs')
export class IdempotencyLog {
  @PrimaryColumn()
  key!: string;

  @Column({ type: 'json' })
  response!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}

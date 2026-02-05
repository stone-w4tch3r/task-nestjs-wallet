import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { Wallet } from '../entities/wallet.entity.js';
import { DailyLimit } from '../entities/daily-limit.entity.js';
import { Transaction } from '../entities/transaction.entity.js';
import { IdempotencyLog } from '../entities/idempotency-log.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, DailyLimit, Transaction, IdempotencyLog]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}

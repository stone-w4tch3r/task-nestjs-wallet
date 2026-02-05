import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Wallet } from '../entities/wallet.entity';
import { DailyLimit } from '../entities/daily-limit.entity';
import { Transaction } from '../entities/transaction.entity';
import { IdempotencyLog } from '../entities/idempotency-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, DailyLimit, Transaction, IdempotencyLog]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}

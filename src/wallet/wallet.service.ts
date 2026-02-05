import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { DailyLimit } from '../entities/daily-limit.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { IdempotencyLog } from '../entities/idempotency-log.entity';
import { TopupDto } from './dto/topup.dto';
import { ChargeDto } from './dto/charge.dto';
import { v4 as uuidv4 } from 'uuid';

const DAILY_LIMIT = 10000;

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(IdempotencyLog)
    private idempotencyLogRepository: Repository<IdempotencyLog>,
    private dataSource: DataSource,
  ) {}

  async topup(dto: TopupDto): Promise<{ success: boolean; newBalance: number }> {
    return this.dataSource.transaction(async (manager) => {
      const idempotencyLog = await manager.findOne(IdempotencyLog, {
        where: { key: dto.idempotencyKey },
      });

      if (idempotencyLog) {
        return idempotencyLog.response as { success: boolean; newBalance: number };
      }

      let wallet = await manager.findOne(Wallet, {
        where: { userId: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = manager.create(Wallet, {
          id: uuidv4(),
          userId: dto.userId,
          balance: 0,
        });
      }

      wallet.balance += dto.amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        id: uuidv4(),
        type: TransactionType.TOPUP,
        walletId: wallet.id,
        amount: dto.amount,
      });
      await manager.save(transaction);

      const response = { success: true, newBalance: wallet.balance };

      const idempotencyEntry = manager.create(IdempotencyLog, {
        key: dto.idempotencyKey,
        response,
      });
      await manager.save(idempotencyEntry);

      return response;
    });
  }

  async charge(dto: ChargeDto): Promise<{ success: boolean; newBalance: number }> {
    return this.dataSource.transaction(async (manager) => {
      const idempotencyLog = await manager.findOne(IdempotencyLog, {
        where: { key: dto.idempotencyKey },
      });

      if (idempotencyLog) {
        return idempotencyLog.response as { success: boolean; newBalance: number };
      }

      const wallet = await manager.findOne(Wallet, {
        where: { userId: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      let dailyLimit = await manager.findOne(DailyLimit, {
        where: { userId: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!dailyLimit) {
        dailyLimit = manager.create(DailyLimit, {
          userId: dto.userId,
          spent: 0,
          date: today,
        });
      } else {
        const limitDate = new Date(dailyLimit.date);
        limitDate.setHours(0, 0, 0, 0);

        if (limitDate.getTime() !== today.getTime()) {
          dailyLimit.spent = 0;
          dailyLimit.date = today;
        }
      }

      if (wallet.balance < dto.amount) {
        throw new BadRequestException('INSUFFICIENT_FUNDS');
      }

      if (dailyLimit.spent + dto.amount > DAILY_LIMIT) {
        throw new BadRequestException('LIMIT_EXCEEDED');
      }

      wallet.balance -= dto.amount;
      dailyLimit.spent += dto.amount;

      await manager.save(wallet);
      await manager.save(dailyLimit);

      const transaction = manager.create(Transaction, {
        id: uuidv4(),
        type: TransactionType.CHARGE,
        walletId: wallet.id,
        amount: dto.amount,
        reason: dto.reason,
      });
      await manager.save(transaction);

      const response = { success: true, newBalance: wallet.balance };

      const idempotencyEntry = manager.create(IdempotencyLog, {
        key: dto.idempotencyKey,
        response,
      });
      await manager.save(idempotencyEntry);

      return response;
    });
  }

  async getBalance(userId: string): Promise<{ userId: string; balance: number; transactions: unknown[] }> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const transactions = await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      userId,
      balance: wallet.balance,
      transactions,
    };
  }
}

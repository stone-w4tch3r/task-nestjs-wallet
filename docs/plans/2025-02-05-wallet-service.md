# Wallet Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a transaction-safe Wallet API with idempotency and daily spending limits using Nest.js, TypeORM, and PostgreSQL.

**Architecture:** Nest.js backend with TypeORM for database access, PostgreSQL as database, pessimistic locking for concurrency control, idempotency keys for operation safety, and lazy limit reset for daily spending tracking.

**Tech Stack:** TypeScript, Nest.js, TypeORM, PostgreSQL, Docker, class-validator

---

## Prerequisites

Ensure Docker is running:
```bash
docker ps
```

Expected: Docker daemon responds with container list (possibly empty)

---

## Section 1: Project Initialization

### Task 1: Initialize Nest.js project

**Files:**
- Create: Various Nest.js scaffold files
- Create: `package.json`, `tsconfig.json`, `nest-cli.json`

**Step 1: Initialize Nest.js project**

Run:
```bash
npx -y @nestjs/cli@latest new . --package-manager npm --skip-git --strict
```

Expected: Nest.js project created in current directory

**Step 2: Install required dependencies**

Run:
```bash
npm install --silent @nestjs/typeorm typeorm pg class-validator class-transformer uuid
```

Expected: Dependencies installed successfully

**Step 3: Install dev dependencies**

Run:
```bash
npm install --silent -D @types/uuid
```

Expected: Dev dependencies installed successfully

**Step 4: Commit**

```bash
git init
git add .
git commit -m "init: initialize Nest.js project with TypeORM dependencies"
```

Expected: Git repository initialized, initial commit created

---

### Task 2: Configure ESLint with strict type rules

**Files:**
- Modify: `.eslintrc.json`

**Step 1: Read current ESLint config**

Read: `.eslintrc.json`

**Step 2: Update ESLint config with strict type rules**

Replace content with:
```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint/eslint-plugin"],
  "extends": [
    "plugin:@typescript-eslint/recommended"
  ],
  "root": true,
  "env": {
    "node": true,
    "jest": true
  },
  "ignorePatterns": [".eslintrc.json"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/no-floating-promises": "warn"
  }
}
```

**Step 3: Verify ESLint config works**

Run:
```bash
npx eslint --print-config src/main.ts
```

Expected: ESLint config prints successfully

**Step 4: Commit**

```bash
git add .eslintrc.json
git commit -m "config: add strict ESLint type rules"
```

Expected: Commit created

---

### Task 3: Create Docker Compose for PostgreSQL

**Files:**
- Create: `docker-compose.yml`

**Step 1: Create docker-compose.yml**

Write:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: wallet-postgres
    environment:
      POSTGRES_USER: wallet
      POSTGRES_PASSWORD: wallet123
      POSTGRES_DB: wallet
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wallet"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

**Step 2: Start PostgreSQL container**

Run:
```bash
docker-compose up -d
```

Expected: Container starts, prints "Creating wallet-postgres" and "Starting wallet-postgres"

**Step 3: Verify container is healthy**

Run:
```bash
docker-compose ps
```

Expected: Container status shows "healthy" or "Up"

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "infra: add PostgreSQL Docker Compose configuration"
```

Expected: Commit created

---

### Task 4: Configure TypeORM in app module

**Files:**
- Modify: `src/app.module.ts`

**Step 1: Create entities directory**

Run:
```bash
mkdir -p src/entities
```

Expected: Directory created

**Step 2: Update app.module.ts with TypeORM configuration**

Replace content with:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'wallet',
      password: 'wallet123',
      database: 'wallet',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    WalletModule,
  ],
})
export class AppModule {}
```

**Step 3: Run linter**

Run:
```bash
npx eslint src/app.module.ts --fix
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/app.module.ts src/entities
git commit -m "config: add TypeORM configuration to app module"
```

Expected: Commit created

---

## Section 2: Business Logic Implementation

### Task 5: Create Wallet entity

**Files:**
- Create: `src/entities/wallet.entity.ts`

**Step 1: Write Wallet entity**

Write:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/entities/wallet.entity.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/entities/wallet.entity.ts
git commit -m "feat: add Wallet entity"
```

Expected: Commit created

---

### Task 6: Create DailyLimit entity

**Files:**
- Create: `src/entities/daily-limit.entity.ts`

**Step 1: Write DailyLimit entity**

Write:
```typescript
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
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/entities/daily-limit.entity.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/entities/daily-limit.entity.ts
git commit -m "feat: add DailyLimit entity"
```

Expected: Commit created

---

### Task 7: Create Transaction entity

**Files:**
- Create: `src/entities/transaction.entity.ts`

**Step 1: Write Transaction entity**

Write:
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  TOPUP = 'TOPUP',
  CHARGE = 'CHARGE',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column()
  walletId: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/entities/transaction.entity.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/entities/transaction.entity.ts
git commit -m "feat: add Transaction entity"
```

Expected: Commit created

---

### Task 8: Create IdempotencyLog entity

**Files:**
- Create: `src/entities/idempotency-log.entity.ts`

**Step 1: Write IdempotencyLog entity**

Write:
```typescript
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('idempotency_logs')
export class IdempotencyLog {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'json' })
  response: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/entities/idempotency-log.entity.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/entities/idempotency-log.entity.ts
git commit -m "feat: add IdempotencyLog entity"
```

Expected: Commit created

---

### Task 9: Create DTOs

**Files:**
- Create: `src/wallet/dto/topup.dto.ts`
- Create: `src/wallet/dto/charge.dto.ts`
- Create: `src/wallet/dto/balance-response.dto.ts`

**Step 1: Create wallet/dto directory**

Run:
```bash
mkdir -p src/wallet/dto
```

Expected: Directory created

**Step 2: Write TopupDto**

Write:
```typescript
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class TopupDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
```

**Step 3: Write ChargeDto**

Write:
```typescript
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class ChargeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
```

**Step 4: Write BalanceResponseDto**

Write:
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  reason: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class BalanceResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  balance: number;

  @ApiProperty({ type: [TransactionDto] })
  transactions: TransactionDto[];
}
```

**Step 5: Run linter**

Run:
```bash
npx eslint src/wallet/dto/ --fix
```

Expected: No errors

**Step 6: Commit**

```bash
git add src/wallet/dto/
git commit -m "feat: add DTOs for wallet operations"
```

Expected: Commit created

---

### Task 10: Create Wallet service

**Files:**
- Create: `src/wallet/wallet.service.ts`

**Step 1: Write Wallet service**

Write:
```typescript
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
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/wallet/wallet.service.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/wallet/wallet.service.ts
git commit -m "feat: add Wallet service with transactional operations"
```

Expected: Commit created

---

### Task 11: Create Wallet controller

**Files:**
- Create: `src/wallet/wallet.controller.ts`

**Step 1: Write Wallet controller**

Write:
```typescript
import { Controller, Post, Get, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopupDto } from './dto/topup.dto';
import { ChargeDto } from './dto/charge.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('topup')
  async topup(@Body(new ValidationPipe({ transform: true })) dto: TopupDto) {
    return this.walletService.topup(dto);
  }

  @Post('charge')
  async charge(@Body(new ValidationPipe({ transform: true })) dto: ChargeDto) {
    return this.walletService.charge(dto);
  }

  @Get('balance')
  async getBalance(@Query('userId') userId: string) {
    return this.walletService.getBalance(userId);
  }
}
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/wallet/wallet.controller.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/wallet/wallet.controller.ts
git commit -m "feat: add Wallet controller with API endpoints"
```

Expected: Commit created

---

### Task 12: Create Wallet module

**Files:**
- Create: `src/wallet/wallet.module.ts`

**Step 1: Write Wallet module**

Write:
```typescript
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
    TypeOrmModule.forFeature([
      Wallet,
      DailyLimit,
      Transaction,
      IdempotencyLog,
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
```

**Step 2: Run linter**

Run:
```bash
npx eslint src/wallet/wallet.module.ts --fix
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/wallet/wallet.module.ts
git commit -m "feat: add Wallet module"
```

Expected: Commit created

---

### Task 13: Configure validation pipe globally

**Files:**
- Modify: `src/main.ts`

**Step 1: Read current main.ts**

Read: `src/main.ts`

**Step 2: Update main.ts with validation pipe**

Update to include ValidationPipe:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

**Step 3: Run linter**

Run:
```bash
npx eslint src/main.ts --fix
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/main.ts
git commit -m "config: add global validation pipe"
```

Expected: Commit created

---

## Section 3: Testing and Validation

### Task 14: Build and start application

**Files:**
- No file changes

**Step 1: Run TypeScript compilation**

Run:
```bash
npm run build
```

Expected: Build completes successfully, no TypeScript errors

**Step 2: Start application in background**

Run:
```bash
npm run start > app.log 2>&1 &
echo $! > app.pid
```

Expected: Process started, PID saved to app.pid

**Step 3: Wait for application to start**

Run:
```bash
sleep 5
tail -n 20 app.log
```

Expected: Log shows "Application is running on: http://localhost:3000"

**Step 4: Verify application is running**

Run:
```bash
curl -s http://localhost:3000/ || echo "Server not responding"
```

Expected: 404 Not Found (server is running)

**Step 5: Commit**

```bash
git add app.log app.pid
git commit -m "test: application started successfully"
```

Expected: Commit created

---

### Task 15: Test topup endpoint

**Files:**
- No file changes

**Step 1: Test initial topup**

Run:
```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 1000, "idempotencyKey": "key1"}'
```

Expected: `{"success":true,"newBalance":1000}`

**Step 2: Test idempotency (same key)**

Run:
```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 2000, "idempotencyKey": "key1"}'
```

Expected: `{"success":true,"newBalance":1000}` (balance unchanged due to idempotency)

**Step 3: Test another topup with different key**

Run:
```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 500, "idempotencyKey": "key2"}'
```

Expected: `{"success":true,"newBalance":1500}`

**Step 4: Commit**

```bash
git add .
git commit -m "test: topup endpoint working with idempotency"
```

Expected: Commit created

---

### Task 16: Test charge endpoint

**Files:**
- No file changes

**Step 1: Test successful charge**

Run:
```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 500, "idempotencyKey": "charge1", "reason": "Purchase"}'
```

Expected: `{"success":true,"newBalance":1000}`

**Step 2: Test insufficient funds**

Run:
```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 50000, "idempotencyKey": "charge2", "reason": "Big purchase"}'
```

Expected: Error with "INSUFFICIENT_FUNDS"

**Step 3: Test idempotency on charge**

Run:
```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 500, "idempotencyKey": "charge1", "reason": "Duplicate"}'
```

Expected: `{"success":true,"newBalance":1000}` (same result as first charge)

**Step 4: Test daily limit**

Run:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/wallet/charge \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user1\", \"amount\": 950, \"idempotencyKey\": \"charge$i\", \"reason\": \"Test $i\"}"
  echo ""
done
```

Expected: Charges succeed until limit reached, then returns "LIMIT_EXCEEDED"

**Step 5: Commit**

```bash
git add .
git commit -m "test: charge endpoint working with limits and validation"
```

Expected: Commit created

---

### Task 17: Test balance endpoint

**Files:**
- No file changes

**Step 1: Test balance endpoint**

Run:
```bash
curl -s http://localhost:3000/wallet/balance?userId=user1 | jq .
```

Expected: JSON with userId, balance, and transactions array

**Step 2: Verify transactions count**

Run:
```bash
curl -s http://localhost:3000/wallet/balance?userId=user1 | jq '.transactions | length'
```

Expected: Number <= 10 (limit of last 10 transactions)

**Step 3: Test non-existent wallet**

Run:
```bash
curl -s http://localhost:3000/wallet/balance?userId=nonexistent
```

Expected: Error with "Wallet not found"

**Step 4: Commit**

```bash
git add .
git commit -m "test: balance endpoint working correctly"
```

Expected: Commit created

---

### Task 18: Run linter and typecheck validation

**Files:**
- No file changes

**Step 1: Run ESLint**

Run:
```bash
npx eslint src/
```

Expected: No errors reported

**Step 2: Run TypeScript typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add .
git commit -m "validation: linter and typecheck passing"
```

Expected: Commit created

---

### Task 19: Cleanup and final verification

**Files:**
- No file changes

**Step 1: Stop application**

Run:
```bash
if [ -f app.pid ]; then
  kill $(cat app.pid)
  rm app.pid
fi
```

Expected: Application stopped

**Step 2: Verify Docker container still running**

Run:
```bash
docker-compose ps
```

Expected: PostgreSQL container still running

**Step 3: Commit**

```bash
git add .
git commit -m "final: application tested and verified"
```

Expected: Commit created

---

## Final Validation

### Task 20: Comprehensive validation

**Files:**
- No file changes

**Step 1: Verify all commits are present**

Run:
```bash
git log --oneline
```

Expected: 20 commits showing all tasks completed

**Step 2: Verify all requirements from initial-high-level.md are met**

Checklist:
- [ ] POST /wallet/topup endpoint exists and works
- [ ] POST /wallet/charge endpoint exists and works
- [ ] GET /wallet/balance endpoint exists and works
- [ ] Idempotency works for all operations
- [ ] No negative balances allowed
- [ ] Daily limit of 10000 enforced
- [ ] Returns last N transactions
- [ ] TypeScript strict mode enabled
- [ ] ESLint configured with important type rules
- [ ] PostgreSQL running in Docker

**Step 3: Run final test suite**

Run:
```bash
npm run build && echo "Build successful"
```

Expected: Build completes without errors

**Step 4: Final commit**

```bash
git add .
git commit -m "release: wallet service implementation complete"
```

Expected: Final commit created

---

## Completion

All tasks completed. The wallet service is now fully functional with:
- Transaction-safe operations using TypeORM transactions
- Pessimistic locking for concurrency control
- Idempotency for operation safety
- Daily spending limits with lazy reset
- Strict TypeScript and ESLint configuration
- PostgreSQL database in Docker
- RESTful API with validation

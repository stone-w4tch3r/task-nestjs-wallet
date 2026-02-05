# AGENTS.md

This file provides guidelines and commands for agentic coding agents working in the Wallet Service repository.

---

## Development Commands

### Build & Run
```bash
npm run build              # Build TypeScript
npm run start:dev         # Dev server (watch)
npm run start:prod        # Production server
docker-compose up -d       # Start with Docker
```

### Code Quality
```bash
npm run lint              # Lint and auto-fix
npm run format            # Format with Prettier
npx tsc --noEmit        # TypeScript typecheck
```

### Testing
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test -- -t "test name"     # Run single test
npm run test wallet.service.spec.ts   # Run specific file
```

### Docker Database
```bash
docker exec -it wallet-postgres psql -U wallet -d wallet  # Access DB
docker exec -it wallet-postgres psql -U wallet -d wallet -c "\dt"  # List tables
docker-compose down -v    # Stop and clean
```

---

## Project Architecture

### High-Level Structure
```
src/
├── entities/          # TypeORM database entities (shared)
│   ├── wallet.entity.ts
│   ├── daily-limit.entity.ts
│   ├── transaction.entity.ts
│   └── idempotency-log.entity.ts
├── wallet/            # Feature-based module
│   ├── dto/           # Data Transfer Objects (validated)
│   ├── wallet.controller.ts
│   ├── wallet.service.ts
│   └── wallet.module.ts
├── app.module.ts      # Root module with TypeORM config
└── main.ts           # Entry point
```

### Key Architectural Patterns
- **Feature-based modules:** Group controller, service, DTOs together
- **Entity separation:** Entities in `src/entities/` shared across modules
- **DTO validation:** Use class-validator decorators on all inputs
- **Transactional operations:** All mutations use `dataSource.transaction()` with pessimistic locking
- **Idempotency:** Check idempotency log before any state change

---

## Code Style Guidelines

### TypeScript & Types
- **Explicit return types required:** `async foo(): Promise<string>`
- **Definite assignment assertions:** Entity properties use `!: string`
- **No `any` type:** Strict typing enforced by ESLint
- **Decimal handling:** Convert with `Number()`: `const balance = Number(wallet.balance)`

### Imports
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { IsString, IsNumber } from 'class-validator';
import { Wallet } from '../entities/wallet.entity';
```
- Separate NestJS decorators per line
- Group third-party imports by library
- Use `../entities/` for relative entity imports
- Always use named exports (no default exports)

### Naming Conventions
- **Classes:** PascalCase (`WalletService`, `TopupDto`)
- **Files:** kebab-case (`wallet.service.ts`, `topup.dto.ts`)
- **Methods:** camelCase (`topup`, `getBalance`)
- **Constants:** UPPER_SNAKE_CASE (`DAILY_LIMIT`)
- **DB tables:** plural snake_case (`wallets`, `daily_limits`)
- **Properties:** camelCase (`userId`, `idempotencyKey`)

### Error Handling
- Use NestJS exceptions: `BadRequestException`, `ConflictException`
- Business errors with descriptive messages: `INSUFFICIENT_FUNDS`, `LIMIT_EXCEEDED`
- Validation errors auto-throw via `ValidationPipe`
- Transaction rollback handled automatically by TypeORM

### Database Access
- Use `manager` from transaction context: `await manager.findOne()`
- Pessimistic locking for writes: `{ lock: { mode: 'pessimistic_write' } }`
- Entity creation: `manager.create(Entity, {...})`
- Save: `await manager.save(entity)`

### Controller & Service Patterns
- **Controller:** `@Body(new ValidationPipe({ transform: true }))` on all inputs, delegate to service
- **Service:** All mutations in `dataSource.transaction()`, check idempotency first, return simple DTOs

### Entity & DTO Patterns
```typescript
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance!: number;
}

export class TopupDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;
}
```

### Constants & Config
- Define domain constants at module level: `const DAILY_LIMIT = 10000`
- Environment variables with fallbacks: `process.env.DB_HOST || 'localhost'`

---

## Critical ESLint Rules
- `@typescript-eslint/explicit-function-return-type`: Error (required)
- `@typescript-eslint/no-explicit-any`: Error (prohibited)
- `@typescript-eslint/no-unused-vars`: Error (ignore `_*` args)
- `@typescript-eslint/explicit-module-boundary-types`: Error (required)
- `@typescript-eslint/no-floating-promises`: Warning

---

## Docker Environment
- **Database host:** `postgres` (service name in docker-compose)
- **Local dev:** `localhost` (host machine)
- **Environment:** Set in docker-compose `environment:` section
- **Healthchecks:** Both services have healthchecks

---

## Before Committing
1. Run `npm run lint` - should pass with 0 errors
2. Run `npx tsc --noEmit` - should have no type errors
3. Test manually with curl or docker-compose
4. Ensure no `any` types, no unused imports

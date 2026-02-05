# Architecture Specification: Wallet Service (Live Coding Task)

**Goal:** Implement a transaction-safe Wallet API with idempotency and daily limits within 20 minutes.
**Stack:** TypeScript, Nest.js, TypeORM, PostgreSQL (or SQLite).

---

## 1. Data Model (Entities)

All entities must be defined using TypeORM decorators.

### A. `Wallet`
*Stores user balance.*
- `id`: UUID (PK)
- `userId`: String (Unique)
- `balance`: Decimal (scale: 2) or Float (default: 0)
- `createdAt`: Date

### B. `DailyLimit`
*Tracks daily spending to enforce limits. Separated from Wallet for SRP.*
- `userId`: String (PK)
- `spent`: Decimal/Float (amount spent today)
- `date`: Date (the date for which the `spent` amount is valid)

### C. `Transaction` (Audit/Outbox)
*Immutable ledger of all operations.*
- `id`: UUID (PK)
- `walletId`: UUID (FK to Wallet)
- `type`: Enum ('TOPUP', 'CHARGE')
- `amount`: Decimal/Float
- `reason`: String (optional)
- `createdAt`: Date

### D. `IdempotencyLog`
*Ensures operations are processed exactly once.*
- `key`: String (PK) - The idempotency key from request
- `response`: JSON - Stores the result of the successful operation to replay it
- `createdAt`: Date

---

## 2. API Endpoints (Controller)

Use `class-validator` for DTOs.

### `POST /wallet/topup`
- **Body:** `{ userId: string, amount: number (>0), idempotencyKey: string }`
- **Logic:** transactional add balance + log transaction + save idempotency.

### `POST /wallet/charge`
- **Body:** `{ userId: string, amount: number (>0), idempotencyKey: string, reason?: string }`
- **Logic:** Transactional debit with limits check (detailed below).

### `GET /wallet/balance/:userId`
- **Returns:** Current balance and last 10 transactions.

---

## 3. Core Business Logic (Service Layer)

**CRITICAL:** All state changes must occur within a **Single Database Transaction** using `EntityManager` or `QueryRunner`.

### Charge Operation Algorithm (`POST /charge`):

1.  **Start DB Transaction (`manager.transaction(...)`)**
2.  **Idempotency Check:**
    *   Query `IdempotencyLog` by key using `manager`.
    *   If exists -> Return stored `response` immediately.
3.  **Pessimistic Locking:**
    *   Fetch `Wallet` by `userId` using `manager.findOne` with `{ lock: { mode: 'pessimistic_write' } }`.
    *   Fetch `DailyLimit` by `userId` using `manager.findOne` with `{ lock: { mode: 'pessimistic_write' } }`.
    *   *Note: If `DailyLimit` does not exist, initialize it in memory with 0 spent.*
4.  **Lazy Limit Reset:**
    *   Compare `dailyLimit.date` with `currentDate` (YYYY-MM-DD).
    *   If dates differ -> Reset `spent = 0` and update `date = currentDate`.
5.  **Validations:**
    *   Check `wallet.balance >= amount` (Throw `InsufficientFunds`).
    *   Check `dailyLimit.spent + amount <= 10000` (Throw `LimitExceeded`).
6.  **State Updates:**
    *   `wallet.balance -= amount`
    *   `dailyLimit.spent += amount`
7.  **Persist Records (using `manager`):**
    *   Save `Wallet`.
    *   Save `DailyLimit`.
    *   Insert `Transaction` record (type: CHARGE, amount: -amount).
    *   Insert `IdempotencyLog` record (key: inputKey, response: successJson).
8.  **Commit:** Automatically handled by transaction wrapper.

---

## 4. Implementation Directives

1.  **No Cron Jobs:** Use "Lazy Reset" strategy for limits (check date on every write).
2.  **Concurrency:** Explicitly use `pessimistic_write` (SELECT FOR UPDATE) to prevent race conditions.
3.  **Atomic:** Never save `Wallet` without saving `Transaction` history.
4.  **Configuration:** Use `synchronize: true` for TypeORM to skip migration generation during live coding.

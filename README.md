# Wallet Service

A transaction-safe electronic wallet API with idempotency and daily spending limits.

## Features

- **Topup**: Add funds to wallet
- **Charge**: Withdraw funds (with daily limit of 10,000)
- **Balance**: View balance and last 10 transactions
- **Idempotency**: Safe retry of operations
- **Concurrency control**: Pessimistic locking prevents race conditions

## Tech Stack

- Nest.js + TypeScript
- TypeORM + PostgreSQL
- Docker Compose

## Quick Start

```bash
# Start PostgreSQL and application
docker-compose up -d

# Test the API
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 1000, "idempotencyKey": "test1"}'

# Check balance
curl http://localhost:3000/wallet/balance?userId=user1

# Stop services
docker-compose down
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## API Endpoints

- `POST /wallet/topup` - Add funds
- `POST /wallet/charge` - Withdraw funds
- `GET /wallet/balance?userId=X` - Get balance and history

## Documentation

- **Test Plan**: `docs/test-plan.md` - 10-minute manual test guide
- **AGENTS.md**: Guidelines for AI coding agents
- **Architecture**: `docs/arch-high-level.md`, `docs/initial-high-level.md`

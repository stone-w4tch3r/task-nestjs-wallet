# Test Task: Wallet Service

Super simple wallet app with enterprise-ish project setup.

Contains transaction-safe electronic wallet API with idempotency and daily spending limits.

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
# Start PostgreSQL, application, and frontend
docker-compose up -d

# Access web UI tester
open http://localhost:8080

# Test the API via curl
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 1000, "idempotencyKey": "test1"}'

# Check balance
curl http://localhost:3000/wallet/balance?userId=user1

# Stop services
docker-compose down
```

### Web UI Tester

A simple HTML frontend is available at **http://localhost:8080** after running `docker-compose up -d`.

Features:

- Test all wallet operations (topup, charge, balance)
- Verbose debugging output with request/response details
- Network error troubleshooting tips
- Stateless design - no client-side storage

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

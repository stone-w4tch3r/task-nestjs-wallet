# Test Task: Wallet Service

Super simple wallet app with enterprise-ish project setup.

Contains transaction-safe electronic wallet API with idempotency and daily spending limits.

## Features

- **Topup**: Add funds to wallet
- **Charge**: Withdraw funds (with daily limit of 10,000)
- **Balance**: View balance and last 10 transactions
- **Idempotency**: Safe retry of operations
- **Concurrency control**: Pessimistic locking prevents race conditions
- **Web UI Tester**: Interactive frontend for testing with verbose debugging

## Tech Stack

- **Backend**: Nest.js + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Frontend**: Static HTML/JS (nginx:alpine)
- **Orchestration**: Docker Compose

## Quick Start

```bash
# Start PostgreSQL and application
docker-compose up -d

# Access web UI tester (same as app root)
open http://localhost:3000

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

A simple HTML frontend is served from the NestJS application at **http://localhost:3000** after running `docker-compose up -d`.

Features:

- Test all wallet operations (topup, charge, balance)
- Verbose debugging output with request/response details
- Network error troubleshooting tips
- Stateless design - no client-side storage
- Same-origin requests (no CORS needed)

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

# Wallet Service - 10-Minute Manual Test Plan

## Overview

This test plan covers main scenarios and edge cases for the wallet service API.

## Setup

```bash
# Start services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Test connectivity
curl http://localhost:3000/  # Should return 404 (normal)
```

## Testing Options

### Option 1: Web UI Tester (Recommended)

Open **http://localhost:3000** in your browser for an interactive testing interface.

Advantages:

- Visual forms for all operations
- Verbose debugging output (timestamps, headers, payloads)
- Network error troubleshooting
- Easy idempotency testing

### Option 2: cURL Commands

Follow the manual test steps below using curl commands.

---

## Test 1: Basic Wallet Operations (2 minutes)

**Web UI Alternative**: Use the forms at http://localhost:3000 - each section corresponds to a test below.

### 1.1 Create wallet explicitly

```bash
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "idempotencyKey": "create1"}'
```

**Expected:** `{"success":true,"userId":"test-user","balance":0}`

### 1.2 Topup wallet

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 1000, "idempotencyKey": "test1"}'
```

**Expected:** `{"success":true,"newBalance":1000}`

### 1.2 Check balance

```bash
curl http://localhost:3000/wallet/balance?userId=test-user
```

**Expected:** JSON with `balance: 1000` and `transactions` array with 1 entry

### 1.3 Charge wallet

```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 200, "idempotencyKey": "test2", "reason": "Coffee"}'
```

**Expected:** `{"success":true,"newBalance":800}`

### 1.4 Verify balance updated

```bash
curl http://localhost:3000/wallet/balance?userId=test-user
```

**Expected:** `balance: 800`, transactions count: 2

---

## Test 2: Idempotency (1 minute)

**Web UI Alternative**: Use the same `idempotencyKey` multiple times in the Topup or Charge forms. Watch the debug output to see the idempotency in action.

### 2.1 Duplicate topup

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 5000, "idempotencyKey": "test1"}'
```

**Expected:** `{"success":true,"newBalance":1000}` (balance NOT changed)

### 2.2 Duplicate charge

```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 1000, "idempotencyKey": "test2", "reason": "Duplicate"}'
```

**Expected:** `{"success":true,"newBalance":800}` (balance NOT changed)

**Verify:** Balance should still be 800

### 2.3 Idempotency with different amounts (critical edge case)

```bash
# First topup with 1000
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "idempotency-user", "amount": 1000, "idempotencyKey": "same-key"}'

# Try same idempotency key but with different amount 5000
# Should return CACHED response from first request, NOT process 5000
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "idempotency-user", "amount": 5000, "idempotencyKey": "same-key"}'
```

**Expected:** Second request returns `newBalance: 1000` (cached response from first request)

**Verify:**

```bash
curl http://localhost:3000/wallet/balance?userId=idempotency-user
```

**Expected:** Balance is 1000 (NOT 6000 - 5000 was NOT processed)

---

## Test 3: Business Rules (2 minutes)

**Web UI Alternative**:

- Try charging more than available balance to see `INSUFFICIENT_FUNDS`
- Try charging more than 10,000 total to see `LIMIT_EXCEEDED`
- Use a new user ID to test non-existent wallet errors

### 3.1 Insufficient funds

```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 10000, "idempotencyKey": "test3", "reason": "Too much"}'
```

**Expected:** Error with `INSUFFICIENT_FUNDS`

### 3.2 Daily limit enforcement

```bash
# Try to charge over 10000 total for the day
for i in {1..15}; do
  curl -s -X POST http://localhost:3000/wallet/charge \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"test-user\", \"amount\": 800, \"idempotencyKey\": \"limit-$i\", \"reason\": \"Test\"}"
  echo ""
done
```

**Expected:** Charges succeed until daily spent + amount > 10000, then `LIMIT_EXCEEDED`

### 3.2.1 Single charge over daily limit (edge case)

```bash
# Setup user with 20000 balance
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "limit-edge-user", "amount": 20000, "idempotencyKey": "setup"}'

# Try to charge 11000 in a single transaction (over daily limit)
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "limit-edge-user", "amount": 11000, "idempotencyKey": "overlimit1", "reason": "Large purchase"}'
```

**Expected:** Error with `LIMIT_EXCEEDED`

**Verify:**

```bash
curl http://localhost:3000/wallet/balance?userId=limit-edge-user
```

**Expected:** Balance should still be 20000 (no charge should have been processed)

### 3.2.2 Boundary test - exactly at daily limit

```bash
# Setup user with 20000 balance
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "boundary-user", "amount": 20000, "idempotencyKey": "setup"}'

# Charge exactly 10000 (should succeed)
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "boundary-user", "amount": 10000, "idempotencyKey": "boundary1", "reason": "At limit"}'

# Try to charge 1 more (should fail - already at limit)
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "boundary-user", "amount": 1, "idempotencyKey": "boundary2", "reason": "Over limit"}'
```

**Expected:** First charge succeeds, second charge fails with `LIMIT_EXCEEDED`

**Verify:**

```bash
curl http://localhost:3000/wallet/balance?userId=boundary-user
```

**Expected:** Balance should be 10000 (only first charge succeeded)

### 3.3 Non-existent wallet

```bash
curl http://localhost:3000/wallet/balance?userId=nonexistent
```

**Expected:** Error with `Wallet not found`

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "nonexistent", "amount": 100, "idempotencyKey": "test4"}'
```

**Expected:** Error with `Wallet not found`

```bash
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "nonexistent", "amount": 100, "idempotencyKey": "test5", "reason": "Test"}'
```

**Expected:** Error with `Wallet not found`

---

## Test 4: Concurrency & Race Conditions (2 minutes)

**Web UI Alternative**: For a simplified concurrent test, open multiple browser tabs and rapidly submit the same operation. Use the same `idempotencyKey` to test idempotency, or different keys to test locking. For full concurrency testing, use the curl commands below.

### 4.1 Concurrent identical requests (idempotency stress test)

```bash
# Send 10 identical topup requests simultaneously
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/wallet/topup \
    -H "Content-Type: application/json" \
    -d '{"userId": "concurrent-user", "amount": 100, "idempotencyKey": "concurrent1"}' &
done
wait

# Check balance - should only have 100, not 1000
curl http://localhost:3000/wallet/balance?userId=concurrent-user
```

**Expected:** Balance = 100 (idempotency prevented duplicates)

### 4.2 Concurrent different requests (pessimistic locking)

```bash
# Setup user with 1000 balance
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "race-user", "amount": 1000, "idempotencyKey": "race-setup"}'

# Send 5 concurrent charge requests of 300 each
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/wallet/charge \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"race-user\", \"amount\": 300, \"idempotencyKey\": \"race-$i\", \"reason\": \"Race\"}" &
done
wait

# Check final balance
curl http://localhost:3000/wallet/balance?userId=race-user
```

**Expected:** Balance >= 0 (no negative balance), all successful charges reflected correctly

### 4.3 Daily limit race condition

```bash
# Setup user with 5000 balance
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "limit-user", "amount": 5000, "idempotencyKey": "limit-setup"}'

# Send 10 concurrent charge requests of 800 each (total 8000, should fail after 5000)
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/wallet/charge \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"limit-user\", \"amount\": 800, \"idempotencyKey\": \"limitrace-$i\", \"reason\": \"Test\"}" &
done
wait

# Check balance and verify no over-limit charges
curl http://localhost:3000/wallet/balance?userId=limit-user
```

**Expected:** Daily limit enforced correctly, no race condition bypass

---

## Test 5: Input Validation (1 minute)

### 5.1 Negative amount (topup)

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": -100, "idempotencyKey": "test5"}'
```

**Expected:** Validation error

### 5.2 Zero amount

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 0, "idempotencyKey": "test6"}'
```

**Expected:** Validation error

### 5.3 Missing required fields

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "idempotencyKey": "test7"}'
```

**Expected:** Validation error (missing amount)

### 5.4 Invalid JSON

```bash
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 100'
```

**Expected:** 400 Bad Request / JSON parse error

### 5.5 Decimal precision (floating point arithmetic)

```bash
# Create wallet and topup with fractional amounts
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "decimal-user", "idempotencyKey": "create-decimal"}'

curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "decimal-user", "amount": 0.10, "idempotencyKey": "decimal1"}'

curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "decimal-user", "amount": 0.20, "idempotencyKey": "decimal2"}'

curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "decimal-user", "amount": 0.30, "idempotencyKey": "decimal3", "reason": "Test"}'

# Check final balance - should be exactly 0.00
curl http://localhost:3000/wallet/balance?userId=decimal-user
```

**Expected:** Balance is exactly 0.00 (0.10 + 0.20 - 0.30 = 0.00)

**Critical:** If implementation uses floating point without proper precision handling, result might be `0.00000000000000004` or similar precision error

---

## Test 6: Database Failure Scenarios (1 minute)

### 6.1 Restart database mid-operation

```bash
# In one terminal, start a long-running operation (background)
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "db-test-user", "amount": 1000, "idempotencyKey": "db-test1"}' &

# Immediately restart database
docker-compose restart postgres

# Wait for restart to complete
sleep 10

# Check if operation was atomic (either succeeded or failed cleanly)
curl http://localhost:3000/wallet/balance?userId=db-test-user
```

**Expected:** Either balance updated or not (atomic operation), no partial state

### 6.2 Check database consistency

```bash
# Access database directly
docker exec -it wallet-postgres psql -U wallet -d wallet -c "SELECT COUNT(*) FROM transactions;"

# Query all transactions for test user
docker exec -it wallet-postgres psql -U wallet -d wallet -c "SELECT * FROM transactions t JOIN wallets w ON t.walletId = w.id WHERE w.userId = 'test-user' ORDER BY t.createdAt DESC LIMIT 5;"

# Check idempotency logs
docker exec -it wallet-postgres psql -U wallet -d wallet -c "SELECT * FROM idempotency_logs LIMIT 5;"
```

**Expected:** All records are consistent, no orphaned transactions

### 6.3 Transaction rollback verification

```bash
# This should fail due to insufficient funds, verify no partial writes
curl -X POST http://localhost:3000/wallet/charge \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "amount": 999999, "idempotencyKey": "test-rollback", "reason": "Test"}'

# Verify balance unchanged
curl http://localhost:3000/wallet/balance?userId=test-user

# Check database - no transaction should be recorded for failed charge
docker exec -it wallet-postgres psql -U wallet -d wallet -c "SELECT COUNT(*) FROM transactions WHERE reason = 'Test rollback';"
```

**Expected:** Balance unchanged, no failed transaction in database

---

## Test 7: Edge Cases (1 minute)

### 7.1 Very large amounts

```bash
# Add large amount
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "large-user", "amount": 999999.99, "idempotencyKey": "large1"}'

# Check balance
curl http://localhost:3000/wallet/balance?userId=large-user
```

**Expected:** Large amount handled correctly (within decimal precision limits)

### 7.2 Multiple users

```bash
# Create wallet for user1
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "amount": 500, "idempotencyKey": "multi1"}'

# Create wallet for user2
curl -X POST http://localhost:3000/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user2", "amount": 1000, "idempotencyKey": "multi2"}'

# Verify separate balances
curl http://localhost:3000/wallet/balance?userId=user1
curl http://localhost:3000/wallet/balance?userId=user2
```

**Expected:** Each user has independent balance

### 7.3 Transaction history limit

```bash
# Create 15 transactions for a user
for i in {1..15}; do
  curl -s -X POST http://localhost:3000/wallet/topup \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"history-user\", \"amount\": 10, \"idempotencyKey\": \"history-$i\"}" &
done
wait

# Check balance - should show only last 10 transactions
curl http://localhost:3000/wallet/balance?userId=history-user | grep -o '"id"' | wc -l
```

**Expected:** Balance = 150, transactions count = 10 (limit applied)

---

## Test 8: New Endpoints (1 minute)

### 8.1 Create wallet endpoint

```bash
# Create new wallet
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "new-user", "idempotencyKey": "new-create"}'
```

**Expected:** `{"success":true,"userId":"new-user","balance":0}`

### 8.2 Duplicate wallet creation (idempotency)

```bash
# Try to create same wallet again
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "new-user", "idempotencyKey": "new-create"}'
```

**Expected:** Success (idempotency) - same response as above

### 8.3 Create already existing wallet

```bash
# Try to create with new idempotency key
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "new-user", "idempotencyKey": "new-create2"}'
```

**Expected:** Error with `Wallet already exists`

### 8.4 Database reset

```bash
# Reset database (clears all tables)
curl -X POST http://localhost:3000/admin/db/reset
```

**Expected:** `{"success":true}`

**Verify:**

```bash
# All data should be cleared
curl http://localhost:3000/wallet/balance?userId=test-user
```

**Expected:** Error with `Wallet not found`

---

## Using the Web UI for Testing

### Quick Workflow

1. Open http://localhost:3000
2. Configure API URL (leave empty for same-origin requests)
3. Set default User ID (e.g., `test-user`)
4. Use forms to test operations
5. Review debug output for detailed information

### Debug Output Explained

The web UI provides verbose debugging including:

- **Timestamps**: When each request started/completed
- **HTTP Status**: Response codes and status text
- **Response Time**: Milliseconds for API round-trip
- **Request Headers**: All headers sent to the API
- **Response Headers**: Headers received from API
- **Request/Response Body**: Full JSON payloads
- **Error Stack Traces**: Detailed error information

### Testing Idempotency via Web UI

1. Submit a topup with `idempotencyKey: "test-1"` and amount 1000
2. Check balance - should show 1000
3. Submit another topup with same `idempotencyKey` and different amount (e.g., 5000)
4. Check balance - should still be 1000 (idempotency prevented duplicate)

### Testing Business Rules via Web UI

1. **Insufficient Funds**: Topup 100, then try to charge 1000
2. **Daily Limit**: Topup 15000, then charge 5001 (limit is 10000)
3. **Validation**: Leave fields empty, use negative amounts, or zero

### Web UI Tips

- Use browser tabs to test multiple users simultaneously
- Check browser console (F12) for additional JavaScript errors
- Use "Clear Output" button to clean up before new tests
- Save your test cases by copying the `idempotencyKey` values

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes to clean database
docker-compose down -v

# Check cleanup
docker ps -a
```

---

## Quick Reference Commands

```bash
# View logs
docker-compose logs -f wallet
docker-compose logs -f postgres

# Access database shell
docker exec -it wallet-postgres psql -U wallet -d wallet

# Rebuild and restart
docker-compose up --build -d

# Check database tables
docker exec -it wallet-postgres psql -U wallet -d wallet -c "\dt"
```

---

## Success Criteria

- [ ] All basic operations work (topup, charge, balance) - via Web UI or curl
- [ ] Idempotency prevents duplicate operations
- [ ] Insufficient funds correctly rejected
- [ ] Daily limit enforced (10000)
- [ ] No negative balances possible
- [ ] Concurrency handled correctly (pessimistic locking)
- [ ] Database transactions are atomic (no partial state)
- [ ] Input validation works
- [ ] Multiple users have separate wallets
- [ ] Transaction history limited to 10
- [ ] Web UI displays verbose debug information
- [ ] Network errors are properly reported with troubleshooting tips

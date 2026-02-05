# TypeORM + PostgreSQL Decimal/Number Handling Guide

## The Problem

PostgreSQL `DECIMAL`/`NUMERIC` columns are returned as **strings** by the `node-postgres` driver. Without proper handling, this causes critical bugs:

### Example Bug

```typescript
// DailyLimit.spent is a decimal, returned as "0" (string)
if (dailyLimit.spent + 11000 > 10000) {
  throw new BadRequestException('LIMIT_EXCEEDED');
}
```

**What actually happens:**

- `"0" + 11000` = `"011000"` (string concatenation, not addition!)
- `"011000" > 10000` = `true` (comparing strings lexicographically)
- **Result**: Transaction incorrectly processed, limit check bypassed

## Solutions

### 1. TypeORM Column Transformers (Current Implementation) ✅

**File**: `src/common/transformers/numeric-column.transformer.ts`

Automatically converts between PostgreSQL decimal strings and JavaScript numbers:

```typescript
export class NumericColumnTransformer implements ValueTransformer {
  to(value: number): string {
    return String(value);
  }

  from(value: string): number {
    return Number(value);
  }
}
```

**Usage**:

```typescript
@Column({
  type: 'decimal',
  precision: 10,
  scale: 2,
  transformer: new NumericColumnTransformer()
})
balance!: number;
```

**Pros**:

- Automatic conversion - no manual `Number()` needed
- Works with existing database schema
- Minimal code changes
- Type-safe

**Cons**:

- Still uses floating point arithmetic (minor precision issues possible)

### 2. Store as Integers (Best Practice for Financial Systems)

Store monetary amounts as **integers** (cents/micros) instead of decimals:

```typescript
@Entity('wallets')
export class Wallet {
  @Column({ type: 'bigint' })
  balanceInCents!: number; // 10000 = $100.00
}
```

**Pros**:

- No floating point precision issues
- Simpler arithmetic (always integers)
- Industry standard for financial systems
- No string conversion issues

**Cons**:

- Requires database schema migration
- Need to convert on display (divide by 100)
- All arithmetic must be in cents
- More significant refactoring required

**Migration example**:

```typescript
// Old: balance decimal(10,2) - 100.00
// New: balance bigint - 10000 (stored in cents)

// Display
const displayBalance = wallet.balanceInCents / 100; // 100.00

// Calculation
wallet.balanceInCents += dto.amountInCents;
```

### 3. Manual Number() Conversions (Anti-pattern) ❌

**Don't do this**:

```typescript
const balance = Number(wallet.balance); // Easy to forget!
const newBalance = Number(wallet.balance) + dto.amount;
```

**Problems**:

- Error-prone - easy to miss one conversion
- Code clutter
- Inconsistent throughout codebase
- Not a real solution

## Current Implementation

We're using **Solution 1: TypeORM Column Transformers**.

### Applied To

- `Wallet.balance` - decimal(10,2)
- `DailyLimit.spent` - decimal(10,2)
- `Transaction.amount` - decimal(10,2)

### Benefits

1. **Automatic conversion** - No manual `Number()` calls needed
2. **Type-safe** - Properties remain `number` type
3. **No string concatenation bugs** - Arithmetic works correctly
4. **Minimal refactoring** - Works with existing schema

## Future Improvements

For production financial systems, consider migrating to **integer storage**:

1. Add new columns (e.g., `balance_in_cents`)
2. Migrate existing data: `balance_in_cents = balance * 100`
3. Update code to work in cents
4. Display by dividing by 100
5. Remove old decimal columns

## Common Pitfalls

### ❌ Comparing decimals directly

```typescript
// DON'T - if spent is string "0", this won't work
if (dailyLimit.spent + dto.amount > DAILY_LIMIT) {
}
```

### ✅ Using transformer or Number()

```typescript
// GOOD - transformer handles conversion automatically
if (dailyLimit.spent + dto.amount > DAILY_LIMIT) {
}

// OR manual (but why when transformer exists?)
if (Number(dailyLimit.spent) + dto.amount > DAILY_LIMIT) {
}
```

### ❌ Floating point arithmetic

```typescript
// DON'T - precision issues possible
const result = 0.1 + 0.2; // 0.30000000000000004!
```

### ✅ Using integers or rounding

```typescript
// GOOD - using integers
const resultInCents = 10 + 20; // 30 cents
const display = resultInCents / 100; // 0.30

// OR with proper rounding
const result = Math.round((0.1 + 0.2) * 100) / 100; // 0.30
```

## Best Practices

1. **Always use transformers for decimal columns** - Prevents string conversion bugs
2. **Consider integer storage** for new financial systems - Industry best practice
3. **Never assume decimal columns are numbers** - They're strings without transformers
4. **Add comprehensive tests** - Include edge cases like 0.10 + 0.20 = 0.30
5. **Use `Math.round()` or decimal libraries** - For precision-critical calculations
6. **Document type conversions** - Make it clear in code and docs

## Testing

Ensure tests cover:

- Decimal arithmetic precision
- Boundary values (exactly at limit, just over limit)
- First operations (when spent = 0)
- Zero values
- Negative values (validation should prevent)

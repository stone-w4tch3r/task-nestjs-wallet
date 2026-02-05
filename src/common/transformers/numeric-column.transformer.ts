import { ValueTransformer } from 'typeorm';

/**
 * Transformer to automatically convert PostgreSQL decimal strings to JavaScript numbers.
 *
 * PostgreSQL DECIMAL/NUMERIC types are returned as strings by node-postgres.
 * Without a transformer, TypeORM returns these as strings, causing:
 * - String concatenation instead of addition: "0" + 100 = "0100"
 * - Unexpected comparison results
 * - Type errors throughout the codebase
 *
 * This transformer ensures:
 * - Database values (strings) → JS numbers on read
 * - JS numbers → Database strings on write
 *
 * Usage:
 * @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new NumericColumnTransformer() })
 */
export class NumericColumnTransformer implements ValueTransformer {
  to(value: number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return String(value);
  }

  from(value: string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }
}

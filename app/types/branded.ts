/**
 * Branded Types (Value Objects)
 *
 * Provides compile-time safety for domain primitives.
 * Prevents mixing mint addresses with regular strings,
 * amounts with numbers, etc.
 *
 * Pattern from: dev-skill - "Typsicherheit als Vertrag"
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// BRAND SYMBOLS
// ============================================================================

declare const MintAddressBrand: unique symbol;
declare const AmountBrand: unique symbol;
declare const TransactionSignatureBrand: unique symbol;
declare const SlippageBpsBrand: unique symbol;

// ============================================================================
// BRANDED TYPES
// ============================================================================

/**
 * A validated Solana mint address (44-char base58 string).
 * Can only be created via MintAddress.parse() or MintAddress.unsafeFrom().
 */
export type MintAddress = string & { readonly [MintAddressBrand]: true };

/**
 * A token amount as string to preserve precision.
 * Represents raw lamports/smallest unit (no decimals).
 */
export type Amount = string & { readonly [AmountBrand]: true };

/**
 * A Solana transaction signature (88-char base58 string).
 */
export type TransactionSignature = string & { readonly [TransactionSignatureBrand]: true };

/**
 * Slippage in basis points (0-10000).
 */
export type SlippageBps = number & { readonly [SlippageBpsBrand]: true };

// ============================================================================
// RESULT TYPE (Either/Result pattern)
// ============================================================================

/**
 * Discriminated union for success/failure.
 * Replaces throw/catch with explicit error handling.
 *
 * Pattern from: dev-skill - "Totale Funktionen"
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// eslint-disable-next-line @typescript-eslint/no-redeclare -- Companion object pattern
export const Result = {
  ok: <T>(value: T): Result<T, never> => ({ ok: true, value }),
  err: <E>(error: E): Result<never, E> => ({ ok: false, error }),

  /**
   * Map over success value, pass through errors.
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
    result.ok ? Result.ok(fn(result.value)) : result,

  /**
   * FlatMap/chain for Result.
   */
  flatMap: <T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
  ): Result<U, E> => (result.ok ? fn(result.value) : result),

  /**
   * Unwrap with default value on error.
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T =>
    result.ok ? result.value : defaultValue,

  /**
   * Convert Result to Promise (for async boundaries).
   */
  toPromise: <T, E extends Error>(result: Result<T, E>): Promise<T> =>
    result.ok ? Promise.resolve(result.value) : Promise.reject(result.error),

  /**
   * Wrap a throwing function into Result.
   */
  fromTry: <T>(fn: () => T): Result<T, Error> => {
    try {
      return Result.ok(fn());
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Wrap an async throwing function into Result.
   */
  fromTryAsync: async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
    try {
      return Result.ok(await fn());
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  },
} as const;

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export type ValidationError =
  | { readonly type: 'INVALID_MINT_ADDRESS'; readonly value: string; readonly reason: string }
  | { readonly type: 'INVALID_AMOUNT'; readonly value: string; readonly reason: string }
  | { readonly type: 'INVALID_SLIPPAGE'; readonly value: number; readonly reason: string }
  | { readonly type: 'INVALID_SIGNATURE'; readonly value: string; readonly reason: string };

// ============================================================================
// MINT ADDRESS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-redeclare -- Companion object pattern
export const MintAddress = {
  /**
   * Parse and validate a mint address string.
   * Returns Result instead of throwing.
   *
   * Validation:
   * - Non-empty string
   * - Valid base58 encoding
   * - Valid Solana PublicKey (32 bytes)
   */
  parse: (value: string): Result<MintAddress, ValidationError> => {
    if (!value || value.trim() === '') {
      return Result.err({
        type: 'INVALID_MINT_ADDRESS',
        value,
        reason: 'Mint address cannot be empty',
      });
    }

    if (value.length < 32 || value.length > 44) {
      return Result.err({
        type: 'INVALID_MINT_ADDRESS',
        value,
        reason: `Invalid length: ${value.length} (expected 32-44 characters)`,
      });
    }

    try {
      new PublicKey(value);
      return Result.ok(value as MintAddress);
    } catch {
      return Result.err({
        type: 'INVALID_MINT_ADDRESS',
        value,
        reason: 'Invalid base58 encoding or not a valid public key',
      });
    }
  },

  /**
   * Check if a string is a valid mint address.
   */
  isValid: (value: string): value is MintAddress => {
    const result = MintAddress.parse(value);
    return result.ok;
  },

  /**
   * Unsafe conversion - only use when you KNOW the value is valid.
   * For internal use or when data comes from trusted source.
   */
  unsafeFrom: (value: string): MintAddress => value as MintAddress,

  /**
   * Common mint addresses.
   */
  SOL: 'So11111111111111111111111111111111111111112' as MintAddress,
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as MintAddress,
} as const;

// ============================================================================
// AMOUNT
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-redeclare -- Companion object pattern
export const Amount = {
  /**
   * Parse and validate an amount string.
   * Must be a non-negative integer (no decimals, raw lamports).
   */
  parse: (value: string): Result<Amount, ValidationError> => {
    if (!value || value.trim() === '') {
      return Result.err({
        type: 'INVALID_AMOUNT',
        value,
        reason: 'Amount cannot be empty',
      });
    }

    // Must be numeric string (optionally with leading zeros)
    if (!/^\d+$/.test(value)) {
      return Result.err({
        type: 'INVALID_AMOUNT',
        value,
        reason: 'Amount must be a non-negative integer string',
      });
    }

    // Check for reasonable bounds (no amounts larger than max supply ~10^18)
    if (value.length > 20) {
      return Result.err({
        type: 'INVALID_AMOUNT',
        value,
        reason: 'Amount exceeds maximum possible value',
      });
    }

    return Result.ok(value as Amount);
  },

  /**
   * Check if a string is a valid amount.
   */
  isValid: (value: string): value is Amount => {
    const result = Amount.parse(value);
    return result.ok;
  },

  /**
   * Unsafe conversion - only use when you KNOW the value is valid.
   */
  unsafeFrom: (value: string): Amount => value as Amount,

  /**
   * Create from number (converts to string).
   */
  fromNumber: (value: number): Result<Amount, ValidationError> => {
    if (!Number.isInteger(value) || value < 0) {
      return Result.err({
        type: 'INVALID_AMOUNT',
        value: String(value),
        reason: 'Amount must be a non-negative integer',
      });
    }
    return Result.ok(String(value) as Amount);
  },

  /**
   * Zero amount.
   */
  ZERO: '0' as Amount,
} as const;

// ============================================================================
// SLIPPAGE BPS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-redeclare -- Companion object pattern
export const SlippageBps = {
  /**
   * Parse and validate slippage in basis points.
   * Valid range: 0-10000 (0% - 100%)
   */
  parse: (value: number): Result<SlippageBps, ValidationError> => {
    if (!Number.isInteger(value)) {
      return Result.err({
        type: 'INVALID_SLIPPAGE',
        value,
        reason: 'Slippage must be an integer',
      });
    }

    if (value < 0 || value > 10000) {
      return Result.err({
        type: 'INVALID_SLIPPAGE',
        value,
        reason: 'Slippage must be between 0 and 10000 bps (0-100%)',
      });
    }

    return Result.ok(value as SlippageBps);
  },

  /**
   * Check if a number is valid slippage.
   */
  isValid: (value: number): value is SlippageBps => {
    const result = SlippageBps.parse(value);
    return result.ok;
  },

  /**
   * Unsafe conversion.
   */
  unsafeFrom: (value: number): SlippageBps => value as SlippageBps,

  /**
   * Common slippage values.
   */
  DEFAULT: 50 as SlippageBps, // 0.5%
  LOW: 10 as SlippageBps, // 0.1%
  MEDIUM: 100 as SlippageBps, // 1%
  HIGH: 500 as SlippageBps, // 5%
} as const;

// ============================================================================
// TRANSACTION SIGNATURE
// ============================================================================

export const TransactionSig = {
  /**
   * Parse and validate a transaction signature.
   */
  parse: (value: string): Result<TransactionSignature, ValidationError> => {
    if (!value || value.trim() === '') {
      return Result.err({
        type: 'INVALID_SIGNATURE',
        value,
        reason: 'Signature cannot be empty',
      });
    }

    // Solana signatures are 88 characters base58
    if (value.length !== 88) {
      return Result.err({
        type: 'INVALID_SIGNATURE',
        value,
        reason: `Invalid length: ${value.length} (expected 88 characters)`,
      });
    }

    // Basic base58 character check
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) {
      return Result.err({
        type: 'INVALID_SIGNATURE',
        value,
        reason: 'Invalid base58 encoding',
      });
    }

    return Result.ok(value as TransactionSignature);
  },

  /**
   * Unsafe conversion.
   */
  unsafeFrom: (value: string): TransactionSignature => value as TransactionSignature,
} as const;

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Exhaustive check helper.
 * Use in switch default case to ensure all cases are handled.
 *
 * Pattern from: dev-skill - "Vollständige Operationen"
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Ensure condition is true, return typed value.
 * Use for runtime invariant checks.
 */
export function ensure<T>(
  condition: boolean,
  value: T,
  errorMessage: string
): Result<T, Error> {
  return condition ? Result.ok(value) : Result.err(new Error(errorMessage));
}

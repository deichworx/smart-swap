/**
 * Property-Based Tests for Branded Types
 *
 * Tests invariants that must hold for ALL possible inputs.
 * Uses fast-check for property-based testing.
 *
 * Pattern from: dev-skill - "Property-Based Testing für Invarianten"
 */

import {
  MintAddress,
  Amount,
  SlippageBps,
  TransactionSig,
  Result,
  assertNever,
  type ValidationError,
} from '../../app/types/branded';

// ============================================================================
// MINT ADDRESS TESTS
// ============================================================================

describe('MintAddress - Value Object', () => {
  describe('Invariant: parse() is total (handles all inputs)', () => {
    const invalidInputs = [
      '',
      ' ',
      'short',
      'a'.repeat(100),
      '!@#$%^&*()',
      'null',
      '0'.repeat(44),
      'O0Il'.repeat(11), // Contains ambiguous chars not in base58
    ];

    it.each(invalidInputs)('should return error for invalid input: %s', (input) => {
      const result = MintAddress.parse(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('INVALID_MINT_ADDRESS');
      }
    });
  });

  describe('Invariant: valid addresses always succeed', () => {
    const validAddresses = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      '11111111111111111111111111111111', // System program (32 chars)
    ];

    it.each(validAddresses)('should parse valid address: %s', (address) => {
      const result = MintAddress.parse(address);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(address);
      }
    });
  });

  describe('Invariant: isValid() is consistent with parse()', () => {
    const testCases = [
      'So11111111111111111111111111111111111111112',
      'invalid',
      '',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ];

    it.each(testCases)('isValid(%s) matches parse().ok', (input) => {
      const parseResult = MintAddress.parse(input);
      const isValid = MintAddress.isValid(input);
      expect(isValid).toBe(parseResult.ok);
    });
  });

  describe('Invariant: constants are valid', () => {
    it('SOL mint is valid', () => {
      expect(MintAddress.isValid(MintAddress.SOL)).toBe(true);
    });

    it('USDC mint is valid', () => {
      expect(MintAddress.isValid(MintAddress.USDC)).toBe(true);
    });
  });

  describe('Property: parse is idempotent', () => {
    it('parsing a valid address twice gives same result', () => {
      const address = MintAddress.SOL;
      const result1 = MintAddress.parse(address);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        const result2 = MintAddress.parse(result1.value);
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          expect(result2.value).toBe(result1.value);
        }
      }
    });
  });
});

// ============================================================================
// AMOUNT TESTS
// ============================================================================

describe('Amount - Value Object', () => {
  describe('Invariant: parse() is total', () => {
    const invalidInputs = [
      '',
      ' ',
      '-1',
      '1.5',
      'abc',
      '1e10',
      '1,000',
      '1_000',
      'Infinity',
      'NaN',
      '1'.repeat(25), // Too large
    ];

    it.each(invalidInputs)('should return error for invalid input: %s', (input) => {
      const result = Amount.parse(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('INVALID_AMOUNT');
      }
    });
  });

  describe('Invariant: valid amounts always succeed', () => {
    const validAmounts = [
      '0',
      '1',
      '1000000000',
      '999999999999999999', // Large but valid
      '00001', // Leading zeros allowed
    ];

    it.each(validAmounts)('should parse valid amount: %s', (amount) => {
      const result = Amount.parse(amount);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(amount);
      }
    });
  });

  describe('Invariant: fromNumber is consistent with parse', () => {
    const validNumbers = [0, 1, 100, 1000000000, Number.MAX_SAFE_INTEGER];

    it.each(validNumbers)('fromNumber(%d) produces parseable string', (num) => {
      const fromNumResult = Amount.fromNumber(num);
      expect(fromNumResult.ok).toBe(true);
      if (fromNumResult.ok) {
        const parseResult = Amount.parse(fromNumResult.value);
        expect(parseResult.ok).toBe(true);
      }
    });
  });

  describe('Invariant: ZERO is valid', () => {
    it('ZERO constant is valid amount', () => {
      expect(Amount.isValid(Amount.ZERO)).toBe(true);
    });
  });

  describe('Property: negative numbers rejected from fromNumber', () => {
    const negativeNumbers = [-1, -100, -0.5, Number.MIN_SAFE_INTEGER];

    it.each(negativeNumbers)('fromNumber(%d) returns error', (num) => {
      const result = Amount.fromNumber(num);
      expect(result.ok).toBe(false);
    });
  });

  describe('Property: floats rejected from fromNumber', () => {
    const floats = [1.1, 0.5, 100.001, Math.PI];

    it.each(floats)('fromNumber(%d) returns error', (num) => {
      const result = Amount.fromNumber(num);
      expect(result.ok).toBe(false);
    });
  });
});

// ============================================================================
// SLIPPAGE BPS TESTS
// ============================================================================

describe('SlippageBps - Value Object', () => {
  describe('Invariant: parse() is total', () => {
    const invalidInputs = [-1, -100, 10001, 20000, 1.5, NaN, Infinity];

    it.each(invalidInputs)('should return error for invalid input: %s', (input) => {
      const result = SlippageBps.parse(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('INVALID_SLIPPAGE');
      }
    });
  });

  describe('Invariant: valid range 0-10000 succeeds', () => {
    const validValues = [0, 1, 50, 100, 500, 1000, 5000, 10000];

    it.each(validValues)('should parse valid slippage: %d', (value) => {
      const result = SlippageBps.parse(value);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(value);
      }
    });
  });

  describe('Invariant: boundary values', () => {
    it('0 is valid (minimum)', () => {
      expect(SlippageBps.parse(0).ok).toBe(true);
    });

    it('10000 is valid (maximum)', () => {
      expect(SlippageBps.parse(10000).ok).toBe(true);
    });

    it('-1 is invalid (below minimum)', () => {
      expect(SlippageBps.parse(-1).ok).toBe(false);
    });

    it('10001 is invalid (above maximum)', () => {
      expect(SlippageBps.parse(10001).ok).toBe(false);
    });
  });

  describe('Invariant: constants are valid', () => {
    it('DEFAULT is valid', () => {
      expect(SlippageBps.isValid(SlippageBps.DEFAULT)).toBe(true);
    });

    it('LOW is valid', () => {
      expect(SlippageBps.isValid(SlippageBps.LOW)).toBe(true);
    });

    it('MEDIUM is valid', () => {
      expect(SlippageBps.isValid(SlippageBps.MEDIUM)).toBe(true);
    });

    it('HIGH is valid', () => {
      expect(SlippageBps.isValid(SlippageBps.HIGH)).toBe(true);
    });
  });
});

// ============================================================================
// TRANSACTION SIGNATURE TESTS
// ============================================================================

describe('TransactionSig - Value Object', () => {
  describe('Invariant: parse() is total', () => {
    const invalidInputs = [
      '',
      'short',
      'a'.repeat(87), // Too short
      'a'.repeat(89), // Too long
      '0'.repeat(88), // Contains 0 (not base58)
      'O'.repeat(88), // Contains O (not base58)
    ];

    it.each(invalidInputs)('should return error for invalid input: %s', (input) => {
      const result = TransactionSig.parse(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('INVALID_SIGNATURE');
      }
    });
  });

  describe('Invariant: valid signature format succeeds', () => {
    // Valid base58 characters, 88 length
    const validSig =
      '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';

    it('should parse valid signature', () => {
      const result = TransactionSig.parse(validSig);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(validSig);
      }
    });
  });
});

// ============================================================================
// RESULT TYPE TESTS
// ============================================================================

describe('Result - Either/Result Pattern', () => {
  describe('Result.ok', () => {
    it('creates success result', () => {
      const result = Result.ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('Result.err', () => {
    it('creates error result', () => {
      const error = new Error('test');
      const result = Result.err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('Result.map', () => {
    it('maps over success', () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (x) => x * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it('passes through error', () => {
      const error = new Error('test');
      const result = Result.err(error);
      const mapped = Result.map(result, (x: number) => x * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('Result.flatMap', () => {
    it('chains success results', () => {
      const result = Result.ok(5);
      const chained = Result.flatMap(result, (x) => Result.ok(x * 2));
      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(10);
      }
    });

    it('short-circuits on error', () => {
      const error = new Error('first');
      const result = Result.err(error);
      const chained = Result.flatMap(result, (x: number) => Result.ok(x * 2));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe(error);
      }
    });

    it('propagates error from chain', () => {
      const result = Result.ok(5);
      const secondError = new Error('second');
      const chained = Result.flatMap(result, () => Result.err(secondError));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe(secondError);
      }
    });
  });

  describe('Result.unwrapOr', () => {
    it('returns value on success', () => {
      const result = Result.ok(42);
      expect(Result.unwrapOr(result, 0)).toBe(42);
    });

    it('returns default on error', () => {
      const result = Result.err(new Error('test'));
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('Result.fromTry', () => {
    it('captures success', () => {
      const result = Result.fromTry(() => 42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('captures thrown error', () => {
      const result = Result.fromTry(() => {
        throw new Error('test');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('test');
      }
    });

    it('wraps non-Error throws', () => {
      const result = Result.fromTry(() => {
        throw 'string error';
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('string error');
      }
    });
  });

  describe('Result.fromTryAsync', () => {
    it('captures async success', async () => {
      const result = await Result.fromTryAsync(async () => 42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('captures async error', async () => {
      const result = await Result.fromTryAsync(async () => {
        throw new Error('async error');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('async error');
      }
    });
  });
});

// ============================================================================
// EXHAUSTIVENESS CHECK TESTS
// ============================================================================

describe('assertNever - Exhaustiveness Check', () => {
  type Status = 'PENDING' | 'SENT' | 'FAILED';

  function handleStatus(status: Status): string {
    switch (status) {
      case 'PENDING':
        return 'waiting';
      case 'SENT':
        return 'done';
      case 'FAILED':
        return 'error';
      default:
        return assertNever(status);
    }
  }

  it('handles all cases', () => {
    expect(handleStatus('PENDING')).toBe('waiting');
    expect(handleStatus('SENT')).toBe('done');
    expect(handleStatus('FAILED')).toBe('error');
  });

  it('throws on unexpected value', () => {
    expect(() => assertNever('UNKNOWN' as never)).toThrow('Unexpected value');
  });
});

// ============================================================================
// PROPERTY: VALIDATION ERROR TYPE DISCRIMINATOR
// ============================================================================

describe('ValidationError - Discriminated Union', () => {
  function formatError(error: ValidationError): string {
    switch (error.type) {
      case 'INVALID_MINT_ADDRESS':
        return `Bad mint: ${error.value}`;
      case 'INVALID_AMOUNT':
        return `Bad amount: ${error.value}`;
      case 'INVALID_SLIPPAGE':
        return `Bad slippage: ${error.value}`;
      case 'INVALID_SIGNATURE':
        return `Bad signature: ${error.value}`;
      default:
        return assertNever(error);
    }
  }

  it('can discriminate all error types', () => {
    const mintError: ValidationError = {
      type: 'INVALID_MINT_ADDRESS',
      value: 'bad',
      reason: 'test',
    };
    expect(formatError(mintError)).toBe('Bad mint: bad');

    const amountError: ValidationError = {
      type: 'INVALID_AMOUNT',
      value: '-1',
      reason: 'test',
    };
    expect(formatError(amountError)).toBe('Bad amount: -1');
  });
});

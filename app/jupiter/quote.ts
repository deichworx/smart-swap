import { VersionedTransaction } from '@solana/web3.js';
import { FEE_ACCOUNT, getJupiterHeaders, JUPITER_API_BASE, jupiterLog, PLATFORM_FEE_BPS } from './config';
import { MintAddress, Amount, Result, type ValidationError } from '../types/branded';

// ============================================================================
// TYPES
// ============================================================================

export type QuoteResponse = {
  readonly inputMint: string;
  readonly outputMint: string;
  readonly inAmount: string;
  readonly outAmount: string;
  readonly priceImpactPct: string;
  readonly slippageBps?: number;
  readonly platformFee?: {
    readonly amount: string;
    readonly feeBps: number;
  };
  readonly routePlan: readonly {
    readonly swapInfo: {
      readonly label: string;
    };
  }[];
};

export type SwapParams = {
  readonly inputMint: string;
  readonly outputMint: string;
  readonly amount: string;
  readonly slippageBps?: number;
  readonly platformFeeBps?: number; // Dynamic fee based on SKR tier
};

/**
 * Typed swap params using branded types.
 * Use with getQuoteSafe() for compile-time validation.
 */
export type TypedSwapParams = {
  readonly inputMint: MintAddress;
  readonly outputMint: MintAddress;
  readonly amount: Amount;
  readonly slippageBps?: number;
  readonly platformFeeBps?: number;
};

// ============================================================================
// ERRORS (Discriminated Union)
// ============================================================================

/**
 * Jupiter API error types.
 * Pattern from: dev-skill - "Explizite State-Übergänge"
 */
export type JupiterError =
  | { readonly type: 'VALIDATION_ERROR'; readonly field: string; readonly error: ValidationError }
  | { readonly type: 'API_ERROR'; readonly status: number; readonly message: string }
  | { readonly type: 'NETWORK_ERROR'; readonly message: string }
  | { readonly type: 'RATE_LIMITED'; readonly retryAfter?: number }
  | { readonly type: 'NO_ROUTE'; readonly reason: string };

/**
 * Format Jupiter error for display.
 */
export function formatJupiterError(error: JupiterError): string {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      return `Invalid ${error.field}: ${error.error.reason}`;
    case 'API_ERROR':
      return `Jupiter API Error: ${error.message}`;
    case 'NETWORK_ERROR':
      return `Network Error: ${error.message}`;
    case 'RATE_LIMITED':
      return 'Rate limited. Please try again.';
    case 'NO_ROUTE':
      return `No swap route found: ${error.reason}`;
  }
}

// ============================================================================
// VALIDATION (Legacy - for backward compatibility)
// ============================================================================

/**
 * Validates a Solana mint address.
 * @deprecated Use MintAddress.isValid() instead
 */
export function isValidMintAddress(address: string): boolean {
  return MintAddress.isValid(address);
}

// ============================================================================
// SAFE API (Returns Result instead of throwing)
// Pattern from: dev-skill - "Totale Funktionen"
// ============================================================================

/**
 * Get quote with explicit error handling.
 * Returns Result<QuoteResponse, JupiterError> instead of throwing.
 *
 * Use this when you want compile-time safety and explicit error handling.
 */
export async function getQuoteSafe(
  params: TypedSwapParams
): Promise<Result<QuoteResponse, JupiterError>> {
  const slippage = params.slippageBps ?? 50;

  // Build query params immutably
  const baseParams = [
    `inputMint=${params.inputMint}`,
    `outputMint=${params.outputMint}`,
    `amount=${params.amount}`,
    `slippageBps=${slippage}`,
  ];

  const feeBps = params.platformFeeBps ?? PLATFORM_FEE_BPS;
  const queryParams =
    FEE_ACCOUNT && feeBps > 0
      ? [...baseParams, `platformFeeBps=${feeBps}`]
      : baseParams;

  const url = `${JUPITER_API_BASE}/swap/v1/quote?${queryParams.join('&')}`;

  try {
    jupiterLog('Fetching quote:', url);

    const res = await fetch(url, {
      headers: getJupiterHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      jupiterLog('Quote error:', res.status, text);

      if (res.status === 429) {
        return Result.err({ type: 'RATE_LIMITED' });
      }

      return Result.err({
        type: 'API_ERROR',
        status: res.status,
        message: text,
      });
    }

    const data = await res.json();
    jupiterLog('Quote success:', data.outAmount);
    return Result.ok(data);
  } catch (error) {
    jupiterLog('Network error:', error);
    return Result.err({
      type: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }
}

/**
 * Validate and convert raw params to typed params.
 * Returns Result to handle validation errors explicitly.
 */
export function validateSwapParams(
  params: SwapParams
): Result<TypedSwapParams, JupiterError> {
  const inputMintResult = MintAddress.parse(params.inputMint);
  if (!inputMintResult.ok) {
    return Result.err({
      type: 'VALIDATION_ERROR',
      field: 'inputMint',
      error: inputMintResult.error,
    });
  }

  const outputMintResult = MintAddress.parse(params.outputMint);
  if (!outputMintResult.ok) {
    return Result.err({
      type: 'VALIDATION_ERROR',
      field: 'outputMint',
      error: outputMintResult.error,
    });
  }

  const amountResult = Amount.parse(params.amount);
  if (!amountResult.ok) {
    return Result.err({
      type: 'VALIDATION_ERROR',
      field: 'amount',
      error: amountResult.error,
    });
  }

  return Result.ok({
    inputMint: inputMintResult.value,
    outputMint: outputMintResult.value,
    amount: amountResult.value,
    slippageBps: params.slippageBps,
    platformFeeBps: params.platformFeeBps,
  });
}

// ============================================================================
// LEGACY API (Throws exceptions - for backward compatibility)
// ============================================================================

/**
 * Get quote from Jupiter API.
 * @throws Error on validation or API failure
 * @deprecated Use getQuoteSafe() for explicit error handling
 */
export async function getQuote(params: SwapParams): Promise<QuoteResponse> {
  // Validate mint addresses
  if (!isValidMintAddress(params.inputMint)) {
    throw new Error(`Invalid input mint address: ${params.inputMint}`);
  }
  if (!isValidMintAddress(params.outputMint)) {
    throw new Error(`Invalid output mint address: ${params.outputMint}`);
  }

  const slippage = params.slippageBps ?? 50;
  const queryParams = [
    `inputMint=${params.inputMint}`,
    `outputMint=${params.outputMint}`,
    `amount=${params.amount}`,
    `slippageBps=${slippage}`,
  ];

  // Platform Fee - use dynamic fee from SKR tier, or default
  // Only add if FEE_ACCOUNT is configured AND fee > 0
  const feeBps = params.platformFeeBps ?? PLATFORM_FEE_BPS;
  if (FEE_ACCOUNT && feeBps > 0) {
    queryParams.push(`platformFeeBps=${feeBps}`);
  }

  const url = `${JUPITER_API_BASE}/swap/v1/quote?${queryParams.join('&')}`;

  try {
    jupiterLog('Fetching quote:', url);

    const res = await fetch(url, {
      headers: getJupiterHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      jupiterLog('Quote error:', res.status, text);
      throw new Error(`Quote failed: ${res.status} - ${text}`);
    }
    const data = await res.json();
    jupiterLog('Quote success:', data.outAmount);
    return data;
  } catch (error) {
    jupiterLog('Network error:', error);
    if (error instanceof Error) {
      throw new Error(`Jupiter API Error: ${error.message}`);
    }
    throw error;
  }
}

export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<VersionedTransaction> {
  const body: Record<string, unknown> = {
    quoteResponse: quote,
    userPublicKey,
    wrapAndUnwrapSol: true,
  };

  // Fee Account - only add if configured
  if (FEE_ACCOUNT) {
    body.feeAccount = FEE_ACCOUNT;
  }

  const res = await fetch(`${JUPITER_API_BASE}/swap/v1/swap`, {
    method: 'POST',
    headers: getJupiterHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    jupiterLog('Swap error:', res.status, text);
    throw new Error(`Swap failed: ${res.status}`);
  }

  const { swapTransaction } = await res.json();
  const txBuffer = Buffer.from(swapTransaction, 'base64');
  return VersionedTransaction.deserialize(txBuffer);
}

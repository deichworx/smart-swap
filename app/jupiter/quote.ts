import { VersionedTransaction } from '@solana/web3.js';
import {
  createJupiterApiClient,
  QuoteResponse as JupiterQuoteResponse,
  ResponseError,
} from '@jup-ag/api';
import { FEE_ACCOUNT, JUPITER_API_KEY, jupiterLog, PLATFORM_FEE_BPS } from './config';
import { MintAddress, Amount, Result, type ValidationError } from '../types/branded';

// ============================================================================
// JUPITER API CLIENT (Lazy initialization for testability)
// ============================================================================

let _jupiterApi: ReturnType<typeof createJupiterApiClient> | null = null;

function getJupiterApi() {
  if (!_jupiterApi) {
    _jupiterApi = createJupiterApiClient({
      apiKey: JUPITER_API_KEY || undefined,
    });
  }
  return _jupiterApi;
}

// For testing: reset the client
export function _resetJupiterClient() {
  _jupiterApi = null;
}

// ============================================================================
// TYPES
// ============================================================================

// Re-export Jupiter's QuoteResponse for external use
export type QuoteResponse = JupiterQuoteResponse;

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
  const feeBps = params.platformFeeBps ?? PLATFORM_FEE_BPS;

  try {
    jupiterLog('Fetching quote via @jup-ag/api:', {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
    });

    const quote = await getJupiterApi().quoteGet({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: Number(params.amount),
      slippageBps: slippage,
      platformFeeBps: FEE_ACCOUNT && feeBps > 0 ? feeBps : undefined,
    });

    jupiterLog('Quote success:', quote.outAmount);
    return Result.ok(quote);
  } catch (error) {
    if (error instanceof ResponseError) {
      jupiterLog('API error:', error.response.status);

      if (error.response.status === 429) {
        return Result.err({ type: 'RATE_LIMITED' });
      }

      const text = await error.response.text().catch(() => 'Unknown error');
      return Result.err({
        type: 'API_ERROR',
        status: error.response.status,
        message: text,
      });
    }

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
  const feeBps = params.platformFeeBps ?? PLATFORM_FEE_BPS;

  try {
    jupiterLog('Fetching quote via @jup-ag/api:', params);

    const quote = await getJupiterApi().quoteGet({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: Number(params.amount),
      slippageBps: slippage,
      platformFeeBps: FEE_ACCOUNT && feeBps > 0 ? feeBps : undefined,
    });

    jupiterLog('Quote success:', quote.outAmount);
    return quote;
  } catch (error) {
    jupiterLog('Quote error:', error);
    if (error instanceof ResponseError) {
      const text = await error.response.text().catch(() => 'Unknown error');
      throw new Error(`Quote failed: ${error.response.status} - ${text}`);
    }
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
  try {
    jupiterLog('Getting swap transaction via @jup-ag/api');

    const swapResponse = await getJupiterApi().swapPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        feeAccount: FEE_ACCOUNT || undefined,
      },
    });

    jupiterLog('Swap transaction received');
    const txBuffer = Buffer.from(swapResponse.swapTransaction, 'base64');
    return VersionedTransaction.deserialize(txBuffer);
  } catch (error) {
    jupiterLog('Swap error:', error);
    if (error instanceof ResponseError) {
      const text = await error.response.text().catch(() => 'Unknown error');
      throw new Error(`Swap failed: ${error.response.status} - ${text}`);
    }
    throw error;
  }
}

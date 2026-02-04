/**
 * Integration Tests - Jupiter Quote API
 *
 * Tests the Jupiter quote integration including:
 * - Quote fetching with valid parameters
 * - Error handling for invalid inputs
 * - Platform fee integration
 * - Rate limiting behavior
 */

// Mock @jup-ag/api module
const mockQuoteGet = jest.fn();
const mockSwapPost = jest.fn();

jest.mock('@jup-ag/api', () => ({
  createJupiterApiClient: () => ({
    quoteGet: mockQuoteGet,
    swapPost: mockSwapPost,
  }),
  ResponseError: class ResponseError extends Error {
    response: Response;
    constructor(response: Response, msg?: string) {
      super(msg);
      this.response = response;
      this.name = 'ResponseError';
    }
  },
}));

// Mock config module to provide FEE_ACCOUNT for testing
jest.mock('../../app/jupiter/config', () => ({
  ...jest.requireActual('../../app/jupiter/config'),
  FEE_ACCOUNT: 'TestFeeAccount11111111111111111111111111111',
}));

import { getQuote, getSwapTransaction, QuoteResponse, SwapParams, _resetJupiterClient } from '../../app/jupiter/quote';
import { ResponseError } from '@jup-ag/api';

// Valid Solana mint addresses for testing
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const INVALID_MINT = 'invalid-address';
const SHORT_MINT = 'abc';

// Mock quote response matching Jupiter API types
const mockQuoteResponse: QuoteResponse = {
  inputMint: SOL_MINT,
  outputMint: USDC_MINT,
  inAmount: '1000000000',
  outAmount: '150000000',
  otherAmountThreshold: '148500000',
  swapMode: 'ExactIn',
  priceImpactPct: '0.01',
  slippageBps: 50,
  platformFee: {
    amount: '37500',
    feeBps: 25,
  },
  routePlan: [
    {
      swapInfo: {
        ammKey: 'test-amm',
        label: 'Raydium',
        inputMint: SOL_MINT,
        outputMint: USDC_MINT,
        inAmount: '1000000000',
        outAmount: '150000000',
      },
      percent: 100,
    },
  ],
};

describe('Jupiter Quote Integration', () => {
  beforeEach(() => {
    mockQuoteGet.mockReset();
    mockSwapPost.mockReset();
    _resetJupiterClient(); // Reset so mock gets picked up
  });

  describe('getQuote', () => {
    describe('Valid Requests', () => {
      it('should fetch quote with valid parameters', async () => {
        mockQuoteGet.mockResolvedValueOnce(mockQuoteResponse);

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        const quote = await getQuote(params);

        expect(quote.inputMint).toBe(SOL_MINT);
        expect(quote.outputMint).toBe(USDC_MINT);
        expect(quote.outAmount).toBe('150000000');
        expect(mockQuoteGet).toHaveBeenCalledTimes(1);
      });

      it('should include platform fee in request when configured', async () => {
        mockQuoteGet.mockResolvedValueOnce(mockQuoteResponse);

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
          platformFeeBps: 15, // Custom fee from SKR tier
        };

        await getQuote(params);

        expect(mockQuoteGet).toHaveBeenCalledWith(
          expect.objectContaining({
            platformFeeBps: 15,
          })
        );
      });

      it('should use default slippage when not specified', async () => {
        mockQuoteGet.mockResolvedValueOnce(mockQuoteResponse);

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await getQuote(params);

        expect(mockQuoteGet).toHaveBeenCalledWith(
          expect.objectContaining({
            slippageBps: 50,
          })
        );
      });

      it('should use custom slippage when specified', async () => {
        mockQuoteGet.mockResolvedValueOnce(mockQuoteResponse);

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
          slippageBps: 100, // 1%
        };

        await getQuote(params);

        expect(mockQuoteGet).toHaveBeenCalledWith(
          expect.objectContaining({
            slippageBps: 100,
          })
        );
      });
    });

    describe('Input Validation', () => {
      it('should reject invalid input mint address', async () => {
        const params: SwapParams = {
          inputMint: INVALID_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Invalid input mint address');
        expect(mockQuoteGet).not.toHaveBeenCalled();
      });

      it('should reject invalid output mint address', async () => {
        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: INVALID_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Invalid output mint address');
        expect(mockQuoteGet).not.toHaveBeenCalled();
      });

      it('should reject too short mint address', async () => {
        const params: SwapParams = {
          inputMint: SHORT_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Invalid input mint address');
      });

      it('should reject empty mint address', async () => {
        const params: SwapParams = {
          inputMint: '',
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Invalid input mint address');
      });
    });

    describe('Error Handling', () => {
      it('should handle API error responses', async () => {
        const mockResponse = {
          status: 400,
          text: () => Promise.resolve('Bad Request: Invalid amount'),
        } as Response;
        mockQuoteGet.mockRejectedValueOnce(new ResponseError(mockResponse));

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Quote failed: 400');
      });

      it('should handle rate limiting (429)', async () => {
        const mockResponse = {
          status: 429,
          text: () => Promise.resolve('Rate limit exceeded'),
        } as Response;
        mockQuoteGet.mockRejectedValueOnce(new ResponseError(mockResponse));

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Quote failed: 429');
      });

      it('should handle network errors', async () => {
        mockQuoteGet.mockRejectedValueOnce(new Error('Network request failed'));

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Jupiter API Error: Network request failed');
      });

      it('should handle timeout errors', async () => {
        mockQuoteGet.mockRejectedValueOnce(new Error('Request timeout'));

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Jupiter API Error: Request timeout');
      });
    });
  });

  describe('getSwapTransaction', () => {
    const mockSwapResponse = {
      swapTransaction: Buffer.from(new Uint8Array(200)).toString('base64'),
      lastValidBlockHeight: 12345678,
      prioritizationFeeLamports: 5000,
    };

    it('should fetch swap transaction with valid quote', async () => {
      mockSwapPost.mockResolvedValueOnce(mockSwapResponse);

      const userPublicKey = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV';
      const tx = await getSwapTransaction(mockQuoteResponse, userPublicKey);

      expect(tx).toBeDefined();
      expect(mockSwapPost).toHaveBeenCalledTimes(1);
      expect(mockSwapPost).toHaveBeenCalledWith({
        swapRequest: expect.objectContaining({
          userPublicKey,
          wrapAndUnwrapSol: true,
        }),
      });
    });

    it('should handle swap API errors', async () => {
      const mockResponse = {
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      } as Response;
      mockSwapPost.mockRejectedValueOnce(new ResponseError(mockResponse));

      const userPublicKey = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV';

      await expect(getSwapTransaction(mockQuoteResponse, userPublicKey))
        .rejects.toThrow('Swap failed: 500');
    });
  });
});

describe('Quote Response Validation', () => {
  it('should have all required fields in quote response', () => {
    expect(mockQuoteResponse).toHaveProperty('inputMint');
    expect(mockQuoteResponse).toHaveProperty('outputMint');
    expect(mockQuoteResponse).toHaveProperty('inAmount');
    expect(mockQuoteResponse).toHaveProperty('outAmount');
    expect(mockQuoteResponse).toHaveProperty('priceImpactPct');
    expect(mockQuoteResponse).toHaveProperty('routePlan');
  });

  it('should have valid numeric strings for amounts', () => {
    expect(Number(mockQuoteResponse.inAmount)).toBeGreaterThan(0);
    expect(Number(mockQuoteResponse.outAmount)).toBeGreaterThan(0);
    expect(Number(mockQuoteResponse.priceImpactPct)).toBeGreaterThanOrEqual(0);
  });

  it('should have route plan with at least one route', () => {
    expect(mockQuoteResponse.routePlan.length).toBeGreaterThan(0);
    expect(mockQuoteResponse.routePlan[0].swapInfo.label).toBeDefined();
  });
});

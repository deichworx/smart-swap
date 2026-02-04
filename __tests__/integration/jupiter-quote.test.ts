/**
 * Integration Tests - Jupiter Quote API
 *
 * Tests the Jupiter quote integration including:
 * - Quote fetching with valid parameters
 * - Error handling for invalid inputs
 * - Platform fee integration
 * - Rate limiting behavior
 */

// Mock config module to provide FEE_ACCOUNT for testing
jest.mock('../../app/jupiter/config', () => ({
  ...jest.requireActual('../../app/jupiter/config'),
  FEE_ACCOUNT: 'TestFeeAccount11111111111111111111111111111',
}));

import { getQuote, getSwapTransaction, QuoteResponse, SwapParams } from '../../app/jupiter/quote';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Valid Solana mint addresses for testing
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const INVALID_MINT = 'invalid-address';
const SHORT_MINT = 'abc';

// Mock quote response
const mockQuoteResponse: QuoteResponse = {
  inputMint: SOL_MINT,
  outputMint: USDC_MINT,
  inAmount: '1000000000',
  outAmount: '150000000',
  priceImpactPct: '0.01',
  slippageBps: 50,
  platformFee: {
    amount: '37500',
    feeBps: 25,
  },
  routePlan: [
    { swapInfo: { label: 'Raydium' } },
  ],
};

describe('Jupiter Quote Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getQuote', () => {
    describe('Valid Requests', () => {
      it('should fetch quote with valid parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse),
        });

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        const quote = await getQuote(params);

        expect(quote.inputMint).toBe(SOL_MINT);
        expect(quote.outputMint).toBe(USDC_MINT);
        expect(quote.outAmount).toBe('150000000');
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should include platform fee in request when configured', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse),
        });

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
          platformFeeBps: 15, // Custom fee from SKR tier
        };

        await getQuote(params);

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain('platformFeeBps=15');
      });

      it('should use default slippage when not specified', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse),
        });

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await getQuote(params);

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain('slippageBps=50');
      });

      it('should use custom slippage when specified', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse),
        });

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
          slippageBps: 100, // 1%
        };

        await getQuote(params);

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain('slippageBps=100');
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
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should reject invalid output mint address', async () => {
        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: INVALID_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Invalid output mint address');
        expect(mockFetch).not.toHaveBeenCalled();
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
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request: Invalid amount'),
        });

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Quote failed: 400');
      });

      it('should handle rate limiting (429)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limit exceeded'),
        });

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Quote failed: 429');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

        const params: SwapParams = {
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: '1000000000',
        };

        await expect(getQuote(params)).rejects.toThrow('Jupiter API Error: Network request failed');
      });

      it('should handle timeout errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

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
    };

    it('should fetch swap transaction with valid quote', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSwapResponse),
      });

      const userPublicKey = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV';
      const tx = await getSwapTransaction(mockQuoteResponse, userPublicKey);

      expect(tx).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle swap API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

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

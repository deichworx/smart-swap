import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuote, QuoteResponse } from '../jupiter/quote';
import { parseTokenAmount, Token } from '../jupiter/tokens';

const REFRESH_INTERVAL = 10000; // 10 seconds
const INITIAL_DELAY = 500; // 500ms debounce on input change

type QuoteStatus = 'idle' | 'loading' | 'error';

type UseAutoRefreshingQuoteParams = {
  readonly inputToken: Token;
  readonly outputToken: Token;
  readonly inputAmount: string;
  readonly isConnected: boolean;
  readonly isPaused: boolean; // Pause during signing/executing/success
  readonly platformFeeBps?: number; // Dynamic fee based on SKR tier
};

type UseAutoRefreshingQuoteResult = {
  readonly quote: QuoteResponse | null;
  readonly quoteAge: number;
  readonly status: QuoteStatus;
  readonly error: string | null;
  readonly refresh: () => void;
  readonly clearQuote: () => void;
};

export function useAutoRefreshingQuote({
  inputToken,
  outputToken,
  inputAmount,
  isConnected,
  isPaused,
  platformFeeBps,
}: UseAutoRefreshingQuoteParams): UseAutoRefreshingQuoteResult {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteAge, setQuoteAge] = useState(0);
  const [status, setStatus] = useState<QuoteStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastQuoteTime = useRef<number>(0);
  const isMounted = useRef(true);

  // Track mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchQuote = useCallback(
    async (silent = false) => {
      const amountRaw = parseTokenAmount(inputAmount, inputToken.decimals);
      if (amountRaw === '0') {
        setQuote(null);
        setQuoteAge(0);
        return;
      }

      if (!isConnected) {
        if (!silent) {
          setError('No internet connection');
          setStatus('error');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      if (!silent) {
        setStatus('loading');
      }
      setError(null);

      try {
        const q = await getQuote({
          inputMint: inputToken.mint,
          outputMint: outputToken.mint,
          amount: amountRaw,
          platformFeeBps,
        });

        if (!isMounted.current) return;

        setQuote(q);
        lastQuoteTime.current = Date.now();
        setQuoteAge(0);
        setStatus('idle');
      } catch (e) {
        if (!isMounted.current) return;

        if (!silent) {
          setError(e instanceof Error ? e.message : 'Quote failed');
          setStatus('error');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    },
    [inputToken.mint, inputToken.decimals, outputToken.mint, inputAmount, isConnected, platformFeeBps],
  );

  // Initial load and on parameter change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => fetchQuote(false), INITIAL_DELAY);
    return () => clearTimeout(timeout);
  }, [fetchQuote]);

  // Auto-refresh every REFRESH_INTERVAL
  useEffect(() => {
    if (isPaused || status === 'loading') return;

    const interval = setInterval(() => {
      const amountRaw = parseTokenAmount(inputAmount, inputToken.decimals);
      if (amountRaw !== '0' && status === 'idle') {
        fetchQuote(true);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused, status, inputAmount, inputToken.decimals, fetchQuote]);

  // Update quote age every second
  useEffect(() => {
    if (!quote || isPaused) return;

    const interval = setInterval(() => {
      const age = Math.floor((Date.now() - lastQuoteTime.current) / 1000);
      setQuoteAge(age);
    }, 1000);

    return () => clearInterval(interval);
  }, [quote, isPaused]);

  const refresh = useCallback(() => {
    fetchQuote(false);
  }, [fetchQuote]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setQuoteAge(0);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    quote,
    quoteAge,
    status,
    error,
    refresh,
    clearQuote,
  };
}

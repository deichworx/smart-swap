import { formatAmountAsString, parseRawAmountForDisplay } from './formatAmount';

export type Token = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI?: string;
};

// Populäre Solana Tokens
export const TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
  },
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
  },
];

export function getToken(mint: string): Token | undefined {
  return TOKENS.find(t => t.mint === mint);
}

export function formatTokenAmount(amount: string | number, decimals: number): string {
  const parsed = parseRawAmountForDisplay(amount, decimals);
  return formatAmountAsString(parsed);
}

export function parseTokenAmount(input: string, decimals: number): string {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned) || 0;
  return Math.floor(value * Math.pow(10, decimals)).toString();
}

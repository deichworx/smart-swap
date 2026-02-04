export type SwapRecord = {
  readonly id: string;
  readonly timestamp: number;
  readonly inputMint: string;
  readonly outputMint: string;
  readonly inputAmount: string;
  readonly outputAmount: string;
  readonly signature: string;
  readonly status: 'success' | 'failed';
};

export type JupiterTokenInfo = {
  readonly address: string;
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly logoURI?: string;
  readonly isVerified?: boolean;
  readonly tags?: readonly string[];
  readonly freezeAuthority?: string | null;
  readonly mintAuthority?: string | null;
};

export type TokenCache = {
  readonly tokens: readonly JupiterTokenInfo[];
  readonly updatedAt: number;
};

export type FavoriteTokens = {
  readonly mints: readonly string[];
};

export type WalletAuth = {
  readonly authToken: string;
  readonly publicKeyBase64: string;
};

export type CustomTokenCache = {
  readonly tokens: readonly JupiterTokenInfo[];
  readonly updatedAt: number;
};

export type AppSettings = {
  readonly confettiEnabled: boolean;
  readonly hapticFeedbackEnabled: boolean;
  readonly autoRefreshQuotes: boolean;
  readonly preferredSlippage: number; // basis points, e.g., 50 = 0.5%
};

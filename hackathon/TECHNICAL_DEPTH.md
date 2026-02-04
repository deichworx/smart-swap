# Smart Swap - Technical Documentation

## Architecture Overview

Smart Swap is a native mobile application built with React Native and Expo, designed specifically for the Solana Mobile ecosystem.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.76+ / Expo SDK 52 |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation (native-stack) |
| State | React hooks + Context |
| Storage | AsyncStorage |
| Wallet | Solana Mobile Wallet Adapter |
| DEX | @jup-ag/api (Official Jupiter SDK) |
| RPC | Helius (DAS API support) |

---

## Project Structure

```
app/
├── app.tsx                 # Root navigator & session management
├── polyfills.ts            # React Native crypto polyfills
├── theme.ts                # Design system tokens
│
├── screens/
│   ├── Home.tsx            # Wallet connection
│   ├── Swap.tsx            # Main swap interface
│   ├── History.tsx         # Transaction history
│   ├── Loyalty.tsx         # SKR tier system
│   └── Settings.tsx        # App settings
│
├── components/
│   ├── AmountInput.tsx     # Numeric input with formatting
│   ├── TokenSelector.tsx   # Token picker modal
│   ├── DoubleTapButton.tsx # Confirmation button
│   ├── SwapHistoryCard.tsx # History list item
│   └── Confetti.tsx        # Success animation
│
├── hooks/
│   ├── useAutoRefreshingQuote.ts  # Quote polling
│   ├── useFeeTier.ts              # SKR tier calculation
│   ├── useSwapHistory.ts          # On-chain history
│   ├── useTokenList.ts            # Token search
│   ├── useOwnedTokens.ts          # Wallet balances
│   └── useNetworkStatus.ts        # Connectivity
│
├── jupiter/
│   ├── config.ts           # API configuration
│   ├── quote.ts            # Quote fetching
│   ├── tokens.ts           # Token utilities
│   └── fees.ts             # 15-tier fee system
│
├── solana/
│   ├── config.ts           # RPC connection
│   ├── balance.ts          # Token balance queries
│   └── history.ts          # Transaction parsing
│
├── wallet/
│   ├── wallet.ts           # Wallet abstraction
│   ├── mwa.ts              # Mobile Wallet Adapter
│   └── mock.ts             # Development mock
│
└── storage/
    ├── index.ts            # Storage utilities
    └── types.ts            # Storage schemas
```

---

## Core Features

### 1. Jupiter Integration

**Official SDK** (`@jup-ag/api`)

We use Jupiter's official TypeScript SDK for type-safe API calls:

```typescript
import { createJupiterApiClient } from '@jup-ag/api';

const jupiterApi = createJupiterApiClient({
  apiKey: JUPITER_API_KEY || undefined,
});

export async function getQuote(params: SwapParams): Promise<QuoteResponse> {
  return jupiterApi.quoteGet({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: Number(params.amount),
    slippageBps: params.slippageBps ?? 50,
    platformFeeBps: params.platformFeeBps,
  });
}

export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<VersionedTransaction> {
  const response = await jupiterApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
    },
  });
  return VersionedTransaction.deserialize(
    Buffer.from(response.swapTransaction, 'base64')
  );
}
```

**Auto-Refreshing Quotes** (`app/hooks/useAutoRefreshingQuote.ts`)

- Debounced initial fetch (500ms)
- Auto-refresh every 10 seconds
- Quote age tracking with staleness indicator
- Pause during transaction signing

### 2. 15-Tier Loyalty System

**Fee Calculation** (`app/jupiter/fees.ts`)

```typescript
export const FEE_TIERS: readonly FeeTier[] = [
  { level: 1,  name: 'Explorer',  minSkr: 0,         feeBps: 25 },
  { level: 2,  name: 'Initiate',  minSkr: 1_000,     feeBps: 23 },
  { level: 3,  name: 'Seeker',    minSkr: 5_000,     feeBps: 21 },
  // ... 12 more tiers
  { level: 15, name: 'Mythic',    minSkr: 2_000_000, feeBps: 0  },
];

export function getFeeTier(skrBalance: number): FeeTier {
  for (let i = FEE_TIERS.length - 1; i >= 0; i--) {
    if (skrBalance >= FEE_TIERS[i].minSkr) {
      return FEE_TIERS[i];
    }
  }
  return FEE_TIERS[0];
}

export function getEffectiveFee(baseFee: number, hasSeekerNft: boolean): number {
  if (hasSeekerNft) {
    return Math.max(0, baseFee - SEEKER_NFT_BONUS_BPS);
  }
  return baseFee;
}
```

### 3. Seeker Genesis Token Detection

**SGT Verification** (`app/hooks/useFeeTier.ts`)

```typescript
async function checkSeekerGenesisToken(walletAddress: string): Promise<boolean> {
  // Use Helius DAS API to check for SGT ownership
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: walletAddress,
        displayOptions: { showFungible: false },
      },
    }),
  });

  const data = await response.json();

  return data.result?.items?.some(item =>
    item.authorities?.some(auth =>
      auth.address === SEEKER_SGT_MINT_AUTHORITY
    )
  );
}
```

### 4. Mobile Wallet Adapter

**Wallet Integration** (`app/wallet/mwa.ts`)

```typescript
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export class SolanaMobileWalletAdapter {
  async authorize(): Promise<AuthorizationResult> {
    return transact(async (wallet) => {
      const auth = await wallet.authorize({
        identity: APP_IDENTITY,
        chain: 'solana:mainnet',
      });
      return auth;
    });
  }

  async signAndSendTransaction(tx: Transaction): Promise<string> {
    return transact(async (wallet) => {
      const signed = await wallet.signAndSendTransactions({
        transactions: [tx],
      });
      return signed[0];
    });
  }
}
```

### 5. On-Chain History Parsing

**Jupiter Transaction Detection** (`app/solana/history.ts`)

```typescript
const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

function isJupiterSwap(tx: ParsedTransactionWithMeta): boolean {
  return tx.transaction.message.instructions.some(ix =>
    'programId' in ix && ix.programId.toString() === JUPITER_PROGRAM_ID
  );
}

function parseSwapDetails(tx: ParsedTransactionWithMeta): SwapDetails {
  // Parse pre/post token balances to extract swap amounts
  const preBalances = tx.meta?.preTokenBalances ?? [];
  const postBalances = tx.meta?.postTokenBalances ?? [];
  // ... extraction logic
}
```

---

## Performance Optimizations

### List Virtualization

```typescript
// TokenSelector uses SectionList with optimized settings
<SectionList
  sections={sections}
  initialNumToRender={15}
  maxToRenderPerBatch={15}
  windowSize={5}
  removeClippedSubviews
  keyboardShouldPersistTaps="handled"
/>
```

### Memoization Strategy

```typescript
// List items are memoized to prevent re-renders
const TokenRow = memo(function TokenRow({ item, onSelect }: Props) {
  const handlePress = useCallback(() => onSelect(item), [onSelect, item]);
  // ...
});

// History items receive primitives, not functions
const SwapHistoryCard = memo(function SwapHistoryCard({
  inputSymbol,   // string, not getToken function
  outputSymbol,  // enables effective memoization
  // ...
}: Props) {
  // ...
});
```

### O(1) Balance Lookups

```typescript
// useOwnedTokens uses Map for O(1) lookups
const balanceByMint = useMemo(() => {
  const map = new Map<string, string>();
  for (const token of ownedTokens) {
    map.set(token.mint, token.amount);
  }
  return map;
}, [ownedTokens]);

const getBalance = useCallback(
  (mint: string) => balanceByMint.get(mint) ?? null,
  [balanceByMint]
);
```

### Native Driver Animations

```typescript
// DoubleTapButton uses scaleX transform for GPU acceleration
Animated.timing(progressAnim, {
  toValue: 0,
  duration: TAP_TIMEOUT,
  useNativeDriver: true,  // Runs on UI thread
}).start();

// Applied via transform, not width
<Animated.View style={{ transform: [{ scaleX: progressAnim }] }} />
```

---

## Security Considerations

### Transaction Signing

- All transactions signed via MWA (never expose private keys)
- Double-tap confirmation prevents accidental swaps
- Slippage protection (default 0.5%)

### Token Validation

- Token freeze/mint authority warnings displayed
- Verified token badges from Jupiter API
- Balance validation before swap execution

### Storage Security

- Sensitive data stored in AsyncStorage (sandboxed)
- No private keys stored in app
- Session tokens encrypted at rest

---

## Testing

### Test Coverage

```
Test Suites: 3 passed
Tests:       79 passed
```

### Test Categories

1. **Unit Tests** - Fee calculations, formatters
2. **Architecture Tests** - CLAUDE.md principle compliance
3. **Storage Tests** - Persistence layer

### Running Tests

```bash
npm test                  # Run all tests
npm test -- --coverage    # With coverage report
```

---

## Build & Deployment

### Development

```bash
npm install
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
```

### Production Build

```bash
# Android APK
eas build --platform android --profile production

# iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### Environment Variables

```env
EXPO_PUBLIC_JUPITER_API_KEY=your_key
EXPO_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
EXPO_PUBLIC_SKR_MINT=ExQRYF7ha2C7dgJ9f1keMXwHpnJWub1A7jNJTQKDpump
```

---

## API Dependencies

| Service | Purpose | Rate Limit |
|---------|---------|------------|
| Jupiter API | Quotes & swaps | 1 RPS (free tier) |
| Helius RPC | Token balances, history | Based on plan |
| Helius DAS | NFT ownership (SGT) | Based on plan |

---

## Future Technical Roadmap

1. **Limit Orders** - Off-chain order book with on-chain settlement
2. **DCA (Dollar Cost Averaging)** - Scheduled recurring swaps
3. **Push Notifications** - Price alerts via Firebase
4. **Widget Support** - Home screen swap widget
5. **WalletConnect** - Additional wallet support

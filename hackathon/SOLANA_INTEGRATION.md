# Smart Swap - Solana Network Integration

## Overview

Smart Swap deeply integrates with the Solana ecosystem, leveraging multiple protocols and standards to deliver a seamless mobile trading experience.

---

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│                      Smart Swap                          │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Jupiter    │   │  Solana RPC   │   │   MWA/SWA     │
│  Aggregator   │   │   (Helius)    │   │   Wallets     │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Best Route    │   │ Token Balances│   │ Transaction   │
│ Discovery     │   │ History Parse │   │ Signing       │
│ Swap Execute  │   │ SGT Detection │   │ Authorization │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 1. Mobile Wallet Adapter (MWA)

### What is MWA?

Mobile Wallet Adapter is Solana's standard for mobile dApp-wallet communication. It allows secure transaction signing without exposing private keys.

### Implementation

```typescript
// app/wallet/mwa.ts
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

const APP_IDENTITY = {
  name: 'Smart Swap',
  uri: 'https://smartswap.app',
  icon: 'favicon.png',
};

export class SolanaMobileWalletAdapter {
  private authToken: string | null = null;
  public publicKey: PublicKey | null = null;

  async authorize(): Promise<AuthorizationResult> {
    return transact(async (wallet: Web3MobileWallet) => {
      const result = await wallet.authorize({
        identity: APP_IDENTITY,
        chain: 'solana:mainnet',
      });

      this.authToken = result.auth_token;
      this.publicKey = new PublicKey(result.accounts[0].address);

      return result;
    });
  }

  async signAndSendTransaction(tx: Transaction): Promise<string> {
    return transact(async (wallet: Web3MobileWallet) => {
      // Reauthorize with stored token
      await wallet.reauthorize({
        identity: APP_IDENTITY,
        auth_token: this.authToken!,
      });

      // Sign and send in one step
      const signatures = await wallet.signAndSendTransactions({
        transactions: [tx],
      });

      return bs58.encode(signatures[0]);
    });
  }
}
```

### Session Persistence

```typescript
// Store session for auto-login
await AsyncStorage.setItem('wallet_session', JSON.stringify({
  authToken: result.auth_token,
  publicKey: result.accounts[0].address,
}));

// Restore on app launch
const session = await AsyncStorage.getItem('wallet_session');
if (session) {
  const { authToken, publicKey } = JSON.parse(session);
  wallet.restoreSession(authToken, publicKey);
}
```

---

## 2. Jupiter Aggregator Integration

We use Jupiter's **official TypeScript SDK** (`@jup-ag/api`) for type-safe, maintained API access.

### SDK Setup

```typescript
// app/jupiter/quote.ts
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';

const jupiterApi = createJupiterApiClient({
  apiKey: JUPITER_API_KEY || undefined,
});
```

### Quote Fetching

```typescript
export async function getQuote(params: SwapParams): Promise<QuoteResponse> {
  return jupiterApi.quoteGet({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: Number(params.amount),
    slippageBps: params.slippageBps ?? 50,
    platformFeeBps: params.platformFeeBps, // Dynamic fee from SKR tier
  });
}
```

### Swap Execution

```typescript
export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<VersionedTransaction> {
  const response = await jupiterApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      feeAccount: FEE_ACCOUNT || undefined,
    },
  });

  // Deserialize the transaction
  const txBuffer = Buffer.from(response.swapTransaction, 'base64');
  return VersionedTransaction.deserialize(txBuffer);
}
```

### Why the Official SDK?

| Benefit | Description |
|---------|-------------|
| **Type Safety** | Full TypeScript types from OpenAPI spec |
| **Maintained** | Regular updates from Jupiter team |
| **Secure** | URL building handled internally |
| **Simple** | Less boilerplate code |

### Token List API

```typescript
// Search any token on Solana
export async function searchTokens(query: string): Promise<JupiterTokenInfo[]> {
  const response = await fetch(
    `${JUPITER_API_URL}/tokens/search?query=${encodeURIComponent(query)}`,
    { headers: { 'x-api-key': JUPITER_API_KEY } }
  );
  return response.json();
}
```

---

## 3. Solana RPC Integration

### Connection Setup

```typescript
// app/solana/config.ts
import { Connection } from '@solana/web3.js';

const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL
  ?? 'https://mainnet.helius-rpc.com/?api-key=xxx';

export const connection = new Connection(RPC_URL, 'confirmed');
```

### Token Balance Queries

```typescript
// app/solana/balance.ts
export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<string> {
  // Special case for native SOL
  if (mintAddress === SOL_MINT) {
    const balance = await connection.getBalance(new PublicKey(walletAddress));
    return (balance / LAMPORTS_PER_SOL).toString();
  }

  // SPL Token balance
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(walletAddress),
    { mint: new PublicKey(mintAddress) }
  );

  if (tokenAccounts.value.length === 0) {
    return '0';
  }

  const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
  return balance.uiAmountString ?? '0';
}
```

### Transaction History Parsing

```typescript
// app/solana/history.ts
const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

export async function getSwapHistory(walletAddress: string): Promise<OnChainSwap[]> {
  const signatures = await connection.getSignaturesForAddress(
    new PublicKey(walletAddress),
    { limit: 50 }
  );

  const swaps: OnChainSwap[] = [];

  for (const sig of signatures) {
    const tx = await connection.getParsedTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx && isJupiterSwap(tx)) {
      swaps.push({
        signature: sig.signature,
        timestamp: (sig.blockTime ?? 0) * 1000,
        status: sig.err === null ? 'success' : 'failed',
        ...parseSwapDetails(tx),
      });
    }
  }

  return swaps;
}
```

---

## 4. Helius DAS API (Digital Asset Standard)

### Seeker Genesis Token Detection

Smart Swap uses Helius DAS API to detect Seeker Genesis Token (SGT) ownership for the NFT bonus.

```typescript
// app/hooks/useFeeTier.ts
const SEEKER_SGT_MINT_AUTHORITY = 'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4';

async function checkSeekerGenesisToken(walletAddress: string): Promise<boolean> {
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'sgt-check',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 100,
        displayOptions: {
          showFungible: false,
          showNativeBalance: false,
        },
      },
    }),
  });

  const data = await response.json();

  if (data.result?.items) {
    return data.result.items.some((item: any) =>
      item.authorities?.some(
        (auth: any) => auth.address === SEEKER_SGT_MINT_AUTHORITY
      )
    );
  }

  return false;
}
```

---

## 5. SKR Token Integration

### Token Details

- **Name**: Seeker Token
- **Symbol**: SKR
- **Mint**: `ExQRYF7ha2C7dgJ9f1keMXwHpnJWub1A7jNJTQKDpump`
- **Standard**: SPL Token

### Balance Check for Tier Calculation

```typescript
const [skrBalance, hasSgt] = await Promise.all([
  getTokenBalance(walletAddress, SKR_MINT),
  checkSeekerGenesisToken(walletAddress),
]);

const tier = getFeeTier(parseFloat(skrBalance));
const effectiveFee = getEffectiveFee(tier.feeBps, hasSgt);
```

---

## 6. Platform Fee Integration

### Dynamic Fee Based on Tier

```typescript
// Pass platform fee to Jupiter based on user's tier
const { quote } = useAutoRefreshingQuote({
  inputToken,
  outputToken,
  inputAmount,
  isConnected,
  isPaused,
  platformFeeBps: effectiveFeeBps, // 0-25 based on tier
});
```

### Fee Collection

Jupiter's platform fee system automatically:
1. Calculates fee amount from swap
2. Routes fee to configured fee account
3. Deducts from output amount

---

## Network Diagram

```
User Device (Seeker)
       │
       ▼
┌──────────────────┐
│   Smart Swap     │
│   (React Native) │
└────────┬─────────┘
         │
         │ MWA Protocol
         ▼
┌──────────────────┐
│  Phantom/Solflare│
│     Wallet       │
└────────┬─────────┘
         │
         │ Sign & Send
         ▼
┌──────────────────┐
│   Solana RPC     │
│    (Helius)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Jupiter        │
│   Smart Router   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│         Solana DEXes             │
│  Raydium │ Orca │ Phoenix │ ...  │
└──────────────────────────────────┘
```

---

## Security Considerations

### Private Keys

- **Never** stored in app
- All signing via MWA
- Wallet handles key management

### Transaction Validation

- User reviews in wallet before signing
- Slippage protection (default 0.5%)
- Double-tap confirmation in app

### API Keys

- Jupiter API key in environment variables
- Not exposed in client bundle
- Rate limited at API level

---

## Future Integrations

1. **Compressed NFTs** - Support cNFT collections
2. **Token 2022** - Full Token Extensions support
3. **Blinks** - Solana Actions deep linking
4. **Priority Fees** - Dynamic priority fee estimation
5. **Jito Bundles** - MEV protection for swaps

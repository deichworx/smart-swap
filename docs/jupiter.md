# Jupiter API Integration

## Übersicht

Smart Swap nutzt das offizielle **@jup-ag/api** SDK für die Jupiter Integration. Das SDK bietet typisierte API-Aufrufe und wird von Jupiter aktiv gepflegt.

## Installation

```bash
npm install @jup-ag/api
```

## API Client

```typescript
// app/jupiter/quote.ts
import { createJupiterApiClient } from '@jup-ag/api';

const jupiterApi = createJupiterApiClient({
  apiKey: process.env.EXPO_PUBLIC_JUPITER_API_KEY || undefined,
});
```

## API Flow

```
┌─────────────┐                      ┌─────────────┐
│  Smart Swap │                      │   Jupiter   │
│     App     │                      │     API     │
└──────┬──────┘                      └──────┬──────┘
       │                                    │
       │  jupiterApi.quoteGet({...})        │
       │───────────────────────────────────►│
       │                                    │
       │         QuoteResponse              │
       │◄───────────────────────────────────│
       │                                    │
       │  jupiterApi.swapPost({...})        │
       │───────────────────────────────────►│
       │                                    │
       │      SwapResponse (base64 tx)      │
       │◄───────────────────────────────────│
       │                                    │
       ▼
┌─────────────┐
│   Wallet    │ ── sign & send ──► Blockchain
└─────────────┘
```

## Implementation

### Dateien

| Datei | Zweck |
|-------|-------|
| `app/jupiter/config.ts` | API Key & Logging |
| `app/jupiter/quote.ts` | Quote & Swap via SDK |
| `app/jupiter/tokenLists.ts` | Token Liste & Search |
| `app/jupiter/tokens.ts` | Formatting Utilities |
| `app/jupiter/fees.ts` | SKR Tier Fee Calculation |

### Quote holen

```typescript
import { getQuote } from '@/app/jupiter/quote';

const quote = await getQuote({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: '1000000000', // 1 SOL in Lamports
  slippageBps: 50, // 0.5%
  platformFeeBps: 15, // Dynamic fee from SKR tier
});
```

### Swap Transaction erstellen

```typescript
import { getSwapTransaction } from '@/app/jupiter/quote';

const tx = await getSwapTransaction(quote, userPublicKey);
const signature = await wallet.signAndSendTransaction(tx);
```

### Safe API (Result-based)

Für explizites Error Handling:

```typescript
import { getQuoteSafe, validateSwapParams } from '@/app/jupiter/quote';

const paramsResult = validateSwapParams(rawParams);
if (!paramsResult.ok) {
  console.error(formatJupiterError(paramsResult.error));
  return;
}

const quoteResult = await getQuoteSafe(paramsResult.value);
if (!quoteResult.ok) {
  console.error(formatJupiterError(quoteResult.error));
  return;
}

const quote = quoteResult.value;
```

## SDK vs. Direct API

| Aspekt | @jup-ag/api SDK | Direct fetch() |
|--------|-----------------|----------------|
| **Status** | Offiziell empfohlen | Funktioniert |
| **Types** | Vollständig typisiert | Manuell |
| **Updates** | Automatisch via npm | Manuell |
| **URL-Handling** | Intern sicher | Selbst bauen |

**Migration (Feb 2026):** Von direkten fetch()-Calls auf das offizielle SDK migriert.

## Token Liste

### Dynamische Token-Liste

```typescript
// app/jupiter/tokenLists.ts
const tokens = await fetchTokenList(); // /tokens/v1/strict (24h cached)
const results = await searchTokens('BONK'); // /tokens/v2/search (live)
```

### Fallback Tokens

Bei API-Fehlern werden hardcodierte Tokens verwendet:

| Symbol | Mint | Decimals |
|--------|------|----------|
| SOL | `So111...112` | 9 |
| USDC | `EPjF...t1v` | 6 |
| USDT | `Es9v...NYB` | 6 |
| BONK | `DezX...263` | 5 |
| JUP | `JUPy...vCN` | 6 |

## Platform Fee & Loyalty

### SKR-basierte Fees

```typescript
// app/jupiter/fees.ts
import { calculateFeeForTier, getTierForBalance } from '@/app/jupiter/fees';

const tier = getTierForBalance(skrBalance); // O(1) lookup
const feeBps = calculateFeeForTier(tier, hasSGT);

// Beispiel: 100K SKR + SGT = 0.13% - 0.05% = 0.08%
```

### Fee-Tabelle

| Tier | SKR Required | Base Fee | Mit SGT |
|------|--------------|----------|---------|
| Explorer | 0 | 0.25% | 0.20% |
| Mythic | 2M | FREE | FREE |

Siehe [README.md](../README.md) für alle 15 Tiers.

### Fee Account

```typescript
// .env
EXPO_PUBLIC_FEE_ACCOUNT=your-wallet-address

// Nur wenn gesetzt werden Fees erhoben
```

## Error Handling

### Error Types (Discriminated Union)

```typescript
type JupiterError =
  | { type: 'VALIDATION_ERROR'; field: string; error: ValidationError }
  | { type: 'API_ERROR'; status: number; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'RATE_LIMITED'; retryAfter?: number }
  | { type: 'NO_ROUTE'; reason: string };
```

### Häufige Fehler

| Error | Ursache | Lösung |
|-------|---------|--------|
| `ResponseError (401)` | Ungültiger API Key | Key in .env prüfen |
| `ResponseError (429)` | Rate Limit | Retry mit Backoff |
| `VALIDATION_ERROR` | Ungültige Mint/Amount | Input validieren |
| `NO_ROUTE` | Kein Swap-Pfad | Andere Token-Kombination |

## API Limits

| Tier | Rate Limit |
|------|------------|
| Free | 1 req/sec |
| Paid | Höher |

- Quote Validity: ~30 Sekunden
- Auto-Refresh: Alle 10s im Swap Screen

## Ressourcen

- [@jup-ag/api (npm)](https://www.npmjs.com/package/@jup-ag/api)
- [Jupiter API Docs](https://dev.jup.ag/)
- [API Dashboard](https://portal.jup.ag/)
- [GitHub: jupiter-quote-api-node](https://github.com/jup-ag/jupiter-quote-api-node)

# Jupiter API Integration

## Übersicht

Jupiter ist der führende Swap-Aggregator auf Solana. Wir nutzen die v1 API mit Authentifizierung für beste Routen und Preise.

## API Konfiguration

### Base URL & Authentication

```typescript
// app/jupiter/config.ts
export const JUPITER_API_KEY = 'dein-api-key';
export const JUPITER_API_BASE = 'https://api.jup.ag';

export function getJupiterHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': JUPITER_API_KEY,
  };
}
```

**Wichtig:** Die alte Domain `quote-api.jup.ag` ist deprecated. Alle Requests gehen an `api.jup.ag` mit API-Key Header.

## API Flow

```
┌─────────┐   GET /swap/v1/quote   ┌─────────┐
│   App   │ ──────────────────────►│ Jupiter │
└─────────┘    + x-api-key         │   API   │
     │                             └─────────┘
     │      QuoteResponse               │
     │◄─────────────────────────────────┘
     │
     │    POST /swap/v1/swap
     │─────────────────────────────────►
     │       + x-api-key                │
     │   VersionedTransaction           │
     │◄─────────────────────────────────┘
     │
     ▼
┌─────────┐
│ Wallet  │ ── sign ──► Blockchain
└─────────┘
```

## Implementation

### Dateien

| Datei | Zweck |
|-------|-------|
| `app/jupiter/config.ts` | API Key & Headers |
| `app/jupiter/quote.ts` | Quote & Swap Transactions |
| `app/jupiter/tokenLists.ts` | Token Liste & Search |
| `app/jupiter/tokens.ts` | Formatting Utilities |

### Quote holen

```typescript
import { getQuote } from './jupiter/quote';

const quote = await getQuote({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: '1000000000', // 1 SOL in Lamports
  slippageBps: 50, // 0.5% Slippage
});
```

### Swap Transaction erstellen

```typescript
import { getSwapTransaction } from './jupiter/quote';

const tx = await getSwapTransaction(quote, userPublicKey);
const signature = await wallet.signAndSendTransaction(tx);
```

## Token Liste

### Dynamische Token-Liste

Tokens werden dynamisch von Jupiter geladen und gecached:

```typescript
// app/jupiter/tokenLists.ts

// Cached Token List (24h TTL)
const tokens = await fetchTokenList(); // /tokens/v1/strict

// Live Search (debounced)
const results = await searchTokens('BONK'); // /tokens/v2/search
```

### Token Cache

| Key | TTL | Inhalt |
|-----|-----|--------|
| `@token_cache` | 24h | Jupiter Token List |
| `@favorite_tokens` | Persistent | User Favoriten (Mint Addresses) |

### Fallback Tokens

Bei API-Fehlern werden hardcodierte Tokens verwendet:

| Symbol | Mint | Decimals |
|--------|------|----------|
| SOL | `So111...112` | 9 |
| USDC | `EPjF...t1v` | 6 |
| USDT | `Es9v...NYB` | 6 |
| BONK | `DezX...263` | 5 |
| JUP | `JUPy...vCN` | 6 |
| WIF | `EKpQ...jm` | 6 |
| RAY | `4k3D...X6R` | 6 |

### Token Search API (v2)

Die v2 Search API hat andere Feldnamen als v1:

```typescript
// v2 Response
{
  id: string;        // Mint Address (nicht "address")
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;     // Logo URL (nicht "logoURI")
  isVerified?: boolean;
}
```

## Platform Fee

### Konfiguration

```typescript
// app/jupiter/quote.ts
export const FEE_ACCOUNT = 'DEINE_WALLET_ADRESSE'; // TODO: Vor Production setzen
export const PLATFORM_FEE_BPS = 25; // 0.25%
```

### Wie es funktioniert

1. `platformFeeBps` wird an Quote-Request angehängt
2. Jupiter berechnet Fee in Quote-Response
3. `feeAccount` wird an Swap-Request angehängt
4. Jupiter erstellt Transaction mit Fee-Transfer

**Hinweis:** Fees sind nur aktiv wenn `FEE_ACCOUNT` konfiguriert ist.

### Fee-Berechnung

| BPS | Prozent | Bei 100 USDC Swap |
|-----|---------|-------------------|
| 10 | 0.1% | 0.10 USDC |
| 25 | 0.25% | 0.25 USDC |
| 30 | 0.3% | 0.30 USDC |

## Helper Functions

```typescript
import { formatTokenAmount, parseTokenAmount } from './jupiter/tokens';

// Display: Lamports → Human readable
formatTokenAmount('1000000000', 9); // "1"

// Input: Human readable → Lamports
parseTokenAmount('1.5', 9); // "1500000000"
```

## Error Handling

| Error | Ursache | Lösung |
|-------|---------|--------|
| `401 Unauthorized` | Fehlender/ungültiger API Key | API Key in config.ts prüfen |
| `Quote failed: 400` | Ungültiger Token/Amount | Inputs prüfen, Mint Address validieren |
| `Quote failed: 429` | Rate Limit | Retry mit Backoff |
| `Swap failed: 400` | Quote expired | Neuen Quote holen |
| `Insufficient funds` | Nicht genug Balance | User informieren |
| `outputMint=undefined` | v2 API Mapping Fehler | `id` statt `address` verwenden |

## API Limits

| Tier | Rate Limit | Notiz |
|------|------------|-------|
| Free | ~60 req/min | Für Development |
| Paid | Höher | Für Production empfohlen |

- Quote Validity: ~30 Sekunden
- Auto-Refresh: Alle 10s im Swap Screen
- Debouncing: 500ms bei Input-Änderungen

## Endpoints

| Endpoint | Methode | Zweck |
|----------|---------|-------|
| `/swap/v1/quote` | GET | Quote abrufen |
| `/swap/v1/swap` | POST | Transaction bauen |
| `/tokens/v1/strict` | GET | Verified Token List |
| `/tokens/v2/search` | GET | Live Token Suche |

## Ressourcen

- [Jupiter API Docs](https://station.jup.ag/docs/apis/swap-api)
- [Jupiter GitHub](https://github.com/jup-ag/jupiter-quote-api)
- [API Dashboard](https://portal.jup.ag/) (für API Keys)

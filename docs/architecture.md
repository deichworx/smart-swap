# Architektur

## Verzeichnisstruktur

```
app/
├── app.tsx                    # Entry Point & Navigation Setup
├── theme.ts                   # Design System (Colors, Spacing, Typography)
├── polyfills.ts               # Buffer/Crypto Polyfills
│
├── screens/
│   ├── Home.tsx               # Wallet Connection Entry Screen
│   ├── Swap.tsx               # Main Swap Interface
│   └── History.tsx            # On-Chain Swap History
│
├── components/
│   ├── AmountInput.tsx        # Token Amount Input mit Validation
│   ├── TokenSelector.tsx      # Token Picker Modal mit Search
│   ├── DoubleTapButton.tsx    # Double-Tap Confirm Mechanism
│   ├── SwapHistoryCard.tsx    # Einzelne History-Karte
│   └── PresetButtons.tsx      # Slippage Presets (unused)
│
├── hooks/
│   ├── useTokenList.ts        # Token List Management & Search
│   └── useSwapHistory.ts      # On-Chain Swap History Fetching
│
├── wallet/
│   ├── wallet.ts              # Wallet Export (Mock/Real Toggle)
│   ├── mwaWallet.ts           # Mobile Wallet Adapter Implementation
│   └── mockWallet.ts          # Development Stub
│
├── jupiter/
│   ├── config.ts              # API Key & Headers
│   ├── quote.ts               # Quote & Swap Transaction Building
│   ├── tokens.ts              # Token Formatting Utilities
│   ├── tokenLists.ts          # Token List Fetching & Search
│   └── ultra.ts               # Jupiter Ultra API (experimental)
│
├── solana/
│   ├── balance.ts             # Token & SOL Balance Fetching
│   └── history.ts             # On-Chain Swap History Parsing
│
└── storage/
    ├── index.ts               # AsyncStorage Operations
    └── types.ts               # TypeScript Type Definitions
```

## Navigation Flow

```
Home (Entry Point)
  └─> "Connect Wallet" button
       └─> wallet.authorize() (MWA transact)
           ├─ Success → Navigate to Swap
           └─ Error → Show error message

Swap (Main Screen)
  ├─> "History" button → Navigate to History
  ├─> Wallet badge (long-press) → Disconnect & return to Home
  ├─> "↕" button → Swap token pair positions
  └─> "Tap to Swap" → Execute swap

History
  ├─> "← " back button → Return to Swap
  ├─> Pull-to-refresh → Reload from blockchain
  └─> Tap card → Open Solscan explorer
```

**Initial Route Logic:**
- App prüft `wallet.restoreSession()` beim Start
- Session vorhanden → Navigate to Swap
- Keine Session → Navigate to Home

## State Management

Kein Redux/Zustand - React Hooks + AsyncStorage:

| State | Location | Persistence |
|-------|----------|-------------|
| Wallet Auth | `mwaWallet` (Singleton) | AsyncStorage |
| Swap Form | `Swap.tsx` useState | Memory |
| Quote | `Swap.tsx` useState | Memory |
| Token List | `useTokenList` Hook | AsyncStorage (24h Cache) |
| Favorites | `useTokenList` Hook | AsyncStorage |
| History | `useSwapHistory` Hook | On-Chain (Solana RPC) |

### Swap Screen State

```typescript
// Form State
const [inputToken, setInputToken] = useState<Token>()
const [outputToken, setOutputToken] = useState<Token>()
const [inputAmount, setInputAmount] = useState<string>()

// Quote State
const [quote, setQuote] = useState<QuoteResponse | null>()
const [quoteAge, setQuoteAge] = useState(0)

// Status State
const [status, setStatus] = useState<'idle' | 'loading' | 'signing' | 'executing' | 'success' | 'error'>()

// Balance State
const [inputBalance, setInputBalance] = useState<string | null>()
const [outputBalance, setOutputBalance] = useState<string | null>()
```

## Wallet Abstraction

```typescript
// wallet.ts
const USE_MOCK = __DEV__ && false;
export const wallet = USE_MOCK ? new MockWallet() : mwaWallet;
```

**MWA Wallet Features:**
- `authorize()` - Initiale Wallet-Verbindung via MWA Protocol
- `restoreSession()` - Session aus AsyncStorage wiederherstellen
- `signAndSendTransaction()` - EMPFOHLEN: Wallet handhabt Fees + Replay Protection
- `signTransaction()` - DEPRECATED: Manuelles Senden
- `disconnect()` - Auth State + Storage löschen

**CancellationException Handling:**
- Wallet-App schließt nach Signierung → Exception
- Transaction kann trotzdem erfolgreich sein
- UI zeigt "check wallet for confirmation"

## Data Flow

```
User Input → getQuote() → Jupiter API (/swap/v1/quote)
                              ↓
                         QuoteResponse
                              ↓ (auto-refresh every 10s)
User Confirm → getSwapTransaction() → Jupiter API (/swap/v1/swap)
                                          ↓
                                   VersionedTransaction
                                          ↓
              wallet.signAndSendTransaction() → MWA → Blockchain
                                                        ↓
                                                   TX Signature
                                                        ↓
                                              Refresh Balances
```

## Storage Layer

| Key | Typ | TTL | Zweck |
|-----|-----|-----|-------|
| `@wallet_auth` | `WalletAuth` | Persistent | MWA Session |
| `@token_cache` | `TokenCache` | 24h | Jupiter Token List |
| `@favorite_tokens` | `string[]` | Persistent | User Favoriten (Mint Addresses) |

## External APIs

### Jupiter API
- **Base URL:** `https://api.jup.ag`
- **Auth:** `x-api-key` Header
- **Endpoints:**
  - `/swap/v1/quote` - Quote abrufen
  - `/swap/v1/swap` - Transaction bauen
  - `/tokens/v1/strict` - Token Liste (cached)
  - `/tokens/v2/search` - Live Token Suche

### Solana RPC
- **Default:** `https://api.mainnet-beta.solana.com`
- **Konfigurierbar:** `EXPO_PUBLIC_RPC_URL` Environment Variable
- **Empfohlen:** Helius Free Tier (1M Credits/Monat)
- **Methods:**
  - `getBalance` - SOL Balance
  - `getParsedTokenAccountsByOwner` - SPL Token Balances
  - `getSignaturesForAddress` - Transaction History
  - `getParsedTransaction` - Transaction Details

## Performance Optimierungen

1. **Quote Debouncing:** 500ms Verzögerung bei Input-Änderungen
2. **Token Search Debouncing:** 300ms bei Suche
3. **Balance Caching:** 30s In-Memory Cache
4. **Token List Caching:** 24h AsyncStorage Cache
5. **Silent Quote Refresh:** Fehler werden nicht angezeigt bei Auto-Refresh

## Sicherheit

1. **Private Keys:** Nie in der App - MWA handhabt Signing
2. **Auth Tokens:** In AsyncStorage (Device-protected)
3. **Reauthorization:** Vor jeder Transaction (Token Freshness)
4. **Input Validation:** Decimals Match Token Precision
5. **Rate Limiting:** Debouncing verhindert API Overload

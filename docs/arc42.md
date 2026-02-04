# Smart Swap - Arc42 Architekturdokumentation

## 1. Einführung und Ziele

### 1.1 Aufgabenstellung

Smart Swap ist eine Solana Mobile DApp für den Seeker, die One-Tap Token-Swaps ermöglicht. Die App nutzt Jupiter als DEX-Aggregator für optimale Swap-Routen.

### 1.2 Qualitätsziele

| Priorität | Qualitätsziel | Beschreibung |
|-----------|---------------|--------------|
| 1 | Sicherheit | Keine Private Keys in der App, Delegation an Mobile Wallet Adapter |
| 2 | Benutzerfreundlichkeit | One-Tap Swap ohne komplexe Konfiguration |
| 3 | Performance | Schnelle Quote-Abrufe, reaktive UI |
| 4 | Zuverlässigkeit | Graceful Error Handling, keine Silent Failures |

### 1.3 Stakeholder

| Rolle | Erwartung |
|-------|-----------|
| Endbenutzer | Einfache, schnelle Token-Swaps auf Solana Mobile |
| Entwickler | Wartbarer, testbarer Code |
| Solana dApp Store | Policy-konforme App ohne Malware |

---

## 2. Randbedingungen

### 2.1 Technische Randbedingungen

| Randbedingung | Beschreibung |
|---------------|--------------|
| Plattform | Android (Solana Mobile Seeker) |
| Runtime | React Native 0.81+ mit Expo 54 |
| Wallet-Integration | Mobile Wallet Adapter (MWA) Protocol |
| Netzwerk | Solana Mainnet |
| DEX-Aggregator | Jupiter v6 API |

### 2.2 Organisatorische Randbedingungen

| Randbedingung | Beschreibung |
|---------------|--------------|
| Distribution | Solana dApp Store (primär) |
| Lizenz | Proprietär |
| Entwicklungssprache | TypeScript |

### 2.3 Konventionen

- TypeScript Strict Mode
- Path Alias: `@/*` → Projekt-Root
- Immutable Data Patterns
- Total Functions (keine Exceptions für erwartbare Fälle)

---

## 3. Kontextabgrenzung

### 3.1 Fachlicher Kontext

```
┌─────────────────────────────────────────────────────────────┐
│                        Benutzer                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Smart Swap App                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  │
│  │   Home    │→ │   Swap    │→ │  History  │  │  Confirm│  │
│  │  Screen   │  │  Screen   │  │  Screen   │  │  Dialog │  │
│  └───────────┘  └───────────┘  └───────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Solana Wallet  │  │   Jupiter API   │  │  Solana RPC     │
│  (Phantom etc.) │  │ (Quotes/Tokens) │  │ (Balance/Hist.) │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3.2 Technischer Kontext

| Schnittstelle | Technologie | Zweck |
|---------------|-------------|-------|
| Mobile Wallet Adapter | MWA Protocol | Wallet-Verbindung, Signierung |
| Jupiter Quote API | REST/HTTPS | Swap-Quotes abrufen |
| Jupiter Swap API | REST/HTTPS | Swap-Transaktionen erstellen |
| Jupiter Token API | REST/HTTPS | Token-Liste & Suche |
| Solana RPC | JSON-RPC | Transaktionen, Balances, History |
| AsyncStorage | Key-Value | Session-Persistenz, Token-Cache |

---

## 4. Lösungsstrategie

### 4.1 Technologieentscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Expo/React Native | Cross-Platform-Potential, schnelle Entwicklung |
| MWA statt Embedded Wallet | Sicherheit: Keine Keys in App |
| Jupiter v6 | Bester DEX-Aggregator, optimale Routen |
| React Navigation Native Stack | Performance, native Feel |

### 4.2 Architekturstil

**Clean Architecture mit Feature-Modulen:**

```
app/
├── screens/      # UI Layer (Präsentation)
├── components/   # Shared UI Components
├── hooks/        # Stateful Logic (React Hooks)
├── wallet/       # Wallet Domain
├── jupiter/      # Jupiter/Swap Domain
├── solana/       # Solana RPC Integration
├── storage/      # Persistence Layer
└── polyfills.ts  # Platform Compatibility
```

### 4.3 Qualitätsstrategien

| Qualitätsziel | Strategie |
|---------------|-----------|
| Sicherheit | Delegation an externe Wallets via MWA |
| Benutzerfreundlichkeit | Minimale Schritte: Connect → Amount → Swap |
| Testbarkeit | Mock Wallet für Development |

---

## 5. Bausteinsicht

### 5.1 Ebene 1: Gesamtsystem

```
┌─────────────────────────────────────────────────────────────┐
│                      Smart Swap App                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Screens   │  │  Components │  │      Services       │ │
│  │  ─────────  │  │  ─────────  │  │  ─────────────────  │ │
│  │  Home       │  │  AmountInput│  │  wallet/            │ │
│  │  Swap       │  │  TokenSelect│  │  jupiter/           │ │
│  │  History    │  │  HistoryCard│  │  solana/            │ │
│  └─────────────┘  └─────────────┘  │  storage/           │ │
│                                    └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     Hooks                            │   │
│  │  useTokenList       useSwapHistory                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Ebene 2: Wallet-Modul

| Baustein | Verantwortung |
|----------|---------------|
| `wallet.ts` | Wallet-Instanz Export, Mock/Real Toggle |
| `mwaWallet.ts` | Mobile Wallet Adapter Integration |
| `mockWallet.ts` | Development Mock |

### 5.3 Ebene 2: Jupiter-Modul

| Baustein | Verantwortung |
|----------|---------------|
| `config.ts` | API-Key und Header-Konfiguration |
| `quote.ts` | Quote-Abruf und Swap-Transaction-Erstellung |
| `tokenLists.ts` | Token-Liste Fetching & Caching |
| `tokens.ts` | Token Formatting Utilities |

### 5.4 Ebene 2: Solana-Modul

| Baustein | Verantwortung |
|----------|---------------|
| `config.ts` | RPC URL Config & Shared Connection |
| `balance.ts` | SOL & Token Balance Fetching mit Cache |
| `history.ts` | On-Chain Swap History Parsing |

### 5.5 Ebene 2: Storage-Modul

| Baustein | Verantwortung |
|----------|---------------|
| `index.ts` | AsyncStorage Operations (typsicher) |
| `types.ts` | TypeScript Type Definitions |

### 5.6 Ebene 2: Hooks

| Baustein | Verantwortung |
|----------|---------------|
| `useTokenList.ts` | Token-Liste, Suche, Favoriten Management |
| `useSwapHistory.ts` | On-Chain Swap History Loading |

---

## 6. Laufzeitsicht

### 6.1 Wallet Connection Flow

```
┌────────┐     ┌───────────┐     ┌────────────┐     ┌────────┐
│  User  │     │ HomeScreen│     │ mwaWallet  │     │ Wallet │
└───┬────┘     └─────┬─────┘     └──────┬─────┘     └───┬────┘
    │                │                   │               │
    │ Tap Connect    │                   │               │
    │───────────────>│                   │               │
    │                │ authorize()       │               │
    │                │──────────────────>│               │
    │                │                   │ transact()    │
    │                │                   │──────────────>│
    │                │                   │               │
    │                │                   │<──────────────│
    │                │                   │  authToken +  │
    │                │<──────────────────│  publicKey    │
    │                │                   │               │
    │ Navigate to    │                   │               │
    │ Swap Screen    │                   │               │
    │<───────────────│                   │               │
```

### 6.2 Swap Execution Flow

```
┌────────┐  ┌───────────┐  ┌─────────┐  ┌───────────┐  ┌────────┐
│  User  │  │SwapScreen │  │ Jupiter │  │ mwaWallet │  │ Wallet │
└───┬────┘  └─────┬─────┘  └────┬────┘  └─────┬─────┘  └───┬────┘
    │             │              │             │             │
    │ Enter Amount│              │             │             │
    │────────────>│              │             │             │
    │             │ getQuote()   │             │             │
    │             │─────────────>│             │             │
    │             │<─────────────│             │             │
    │             │   Quote      │             │             │
    │<────────────│              │             │             │
    │ Show Quote  │              │             │             │
    │             │              │             │             │
    │ Tap Swap    │              │             │             │
    │────────────>│              │             │             │
    │             │ getSwapTx()  │             │             │
    │             │─────────────>│             │             │
    │             │<─────────────│             │             │
    │             │ signAndSend()│             │             │
    │             │─────────────────────────-->│             │
    │             │              │             │ sign()      │
    │             │              │             │────────────>│
    │             │              │             │<────────────│
    │             │<─────────────────────────────────────────│
    │             │   txSignature│             │             │
    │<────────────│              │             │             │
    │ Success     │              │             │             │
```

### 6.3 History Loading Flow

```
┌────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐
│  User  │  │HistoryScreen│  │useSwapHistory│  │ Solana RPC │
└───┬────┘  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘
    │              │                │                 │
    │ Navigate to  │                │                 │
    │ History      │                │                 │
    │─────────────>│                │                 │
    │              │ useSwapHistory()                 │
    │              │───────────────>│                 │
    │              │                │ getSignatures() │
    │              │                │────────────────>│
    │              │                │<────────────────│
    │              │                │ for each sig:   │
    │              │                │ getParsedTx()   │
    │              │                │────────────────>│
    │              │                │<────────────────│
    │              │                │ filter Jupiter  │
    │              │                │ parse balances  │
    │              │<───────────────│                 │
    │              │  OnChainSwap[] │                 │
    │<─────────────│                │                 │
    │ Display List │                │                 │
```

---

## 7. Verteilungssicht

### 7.1 Deployment-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    Solana Mobile Seeker                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Solana dApp Store                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │              Smart Swap APK                      │  │ │
│  │  │  ┌─────────────┐  ┌─────────────────────────┐   │  │ │
│  │  │  │ React Native│  │ Mobile Wallet Adapter   │   │  │ │
│  │  │  │ Bundle      │  │ Client Library          │   │  │ │
│  │  │  └─────────────┘  └─────────────────────────┘   │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
│                              │                              │
│  ┌───────────────────────────┼───────────────────────────┐ │
│  │         Wallet Apps       │                            │ │
│  │  ┌─────────┐  ┌─────────┐ │ ┌─────────┐               │ │
│  │  │ Phantom │  │Solflare │ │ │Ultimate │               │ │
│  │  └─────────┘  └─────────┘   └─────────┘               │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      External Services                      │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  Jupiter API    │  │  Solana RPC (Mainnet)           │  │
│  │  quote.jup.ag   │  │  api.mainnet-beta.solana.com    │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Build-Artefakte

| Artefakt | Profil | Verwendung |
|----------|--------|------------|
| `smart-swap-dev.apk` | development | Lokales Testing |
| `smart-swap-preview.apk` | preview | Internal Testing |
| `smart-swap.apk` | dapp-store | Solana dApp Store Release |

---

## 8. Querschnittliche Konzepte

### 8.1 Sicherheit

**Prinzip:** Die App speichert KEINE Private Keys.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Smart Swap    │────>│  MWA Protocol   │────>│  Wallet App     │
│   (keine Keys)  │     │  (Transport)    │     │  (Key Storage)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- Alle Signaturen werden vom externen Wallet durchgeführt
- Auth-Tokens werden für Session-Persistenz genutzt
- Keine sensiblen Daten im App-Storage

### 8.2 MWA Best Practices

**signAndSendTransaction bevorzugen** (Solana Mobile Community Empfehlung)

```typescript
// EMPFOHLEN: Wallet übernimmt Priority Fees + Submission
const signature = await wallet.signAndSendTransaction(tx);

// VERMEIDEN: Manuelles Signieren + Senden
const signedTx = await wallet.signTransaction(tx);
const signature = await connection.sendTransaction(signedTx);
```

**Vorteile:**
- Wallet setzt Priority Fees automatisch (bessere UX)
- Reduziert Replay-Attack-Risiko bei Durable Nonces
- Einzelne User-Bestätigung statt zwei Schritte
- Wallet kann Transaktionsstatus tracken

**Auth Token Management:**
- Tokens für Session-Persistenz speichern
- Bei App-Rückkehr aus Background: `reauthorize()` aufrufen
- Token invalidieren bei explizitem Disconnect

### 8.3 Error Handling

**Total Functions Pattern:**

```typescript
// Schlecht: Partial Function
function getQuote(amount: number): Quote {
  if (amount <= 0) throw new Error('Invalid amount');
  // ...
}

// Gut: Total Function
function getQuote(amount: number): Quote | null {
  if (amount <= 0) return null;
  // ...
}
```

### 8.4 State Management

- Lokaler Component State für UI
- Wallet State in Modul-Singleton (`authState`)
- Keine globalen State-Container (Redux etc.)

---

## 9. Architekturentscheidungen

### ADR-001: Mobile Wallet Adapter statt Embedded Wallet

**Status:** Akzeptiert

**Kontext:** App benötigt Wallet-Funktionalität für Transaktionen.

**Entscheidung:** Nutzung von MWA statt embedded Wallet (wie Privy/Web3Auth).

**Begründung:**
- Keine Key-Verantwortung in der App
- Benutzer behalten Kontrolle über ihre Wallets
- Kompatibel mit allen MWA-fähigen Wallets

### ADR-002: Jupiter als DEX-Aggregator

**Status:** Akzeptiert

**Kontext:** App benötigt Token-Swap-Funktionalität.

**Entscheidung:** Jupiter v6 API für Quotes und Swaps.

**Begründung:**
- Beste Liquidität und Routen auf Solana
- Zuverlässige API
- Keine Listing-Gebühren

### ADR-003: Expo Managed Workflow

**Status:** Akzeptiert

**Kontext:** React Native App mit nativen Abhängigkeiten.

**Entscheidung:** Expo mit EAS Build.

**Begründung:**
- Vereinfachtes Build-Management
- OTA Updates möglich
- Gute MWA-Kompatibilität

---

## 10. Qualitätsanforderungen

### 10.1 Qualitätsbaum

```
                    Qualität
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Sicherheit    Benutzbarkeit    Zuverlässigkeit
        │               │               │
   ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
   │         │     │         │     │         │
 Keine    MWA   Minimal  Schnell  Error   Graceful
 Keys   Delegation Clicks Response Handling Degradation
```

### 10.2 Qualitätsszenarien

| ID | Szenario | Erwartetes Verhalten |
|----|----------|---------------------|
| Q1 | User gibt Amount ein | Quote in <2s sichtbar |
| Q2 | Jupiter API nicht erreichbar | Fehlermeldung, kein Crash |
| Q3 | Wallet lehnt Signatur ab | Zurück zum Swap-Screen |
| Q4 | App wird in Background geschickt | Auth-Token bleibt erhalten |

---

## 11. Risiken und Technische Schulden

### 11.1 Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Jupiter API-Änderung | Mittel | Hoch | API-Version pinnen |
| MWA Protocol-Änderung | Niedrig | Hoch | Adapter-Pattern |
| Wallet-Kompatibilität | Mittel | Mittel | Multi-Wallet-Testing |

### 11.2 Technische Schulden

| Schuld | Priorität | Status |
|--------|-----------|--------|
| ~~Hardcoded Token Mints~~ | ~~Mittel~~ | ✅ Gelöst (dynamische Token-Liste) |
| Keine Offline-Unterstützung | Niedrig | App braucht Internet |
| Single RPC Endpoint | Mittel | Public RPC, kein Fallback |
| Fee Account nicht konfiguriert | Hoch | Platform Fees deaktiviert |
| Jupiter API Key Free Tier | Mittel | Rate-Limited, Production Key nötig |

---

## 12. Glossar

| Begriff | Definition |
|---------|------------|
| **MWA** | Mobile Wallet Adapter - Protokoll für Wallet-Integration |
| **Jupiter** | DEX-Aggregator auf Solana |
| **Seeker** | Solana Mobile Smartphone (2. Generation) |
| **dApp Store** | Solana's dezentraler App Store |
| **Quote** | Preisangebot für einen Token-Swap |
| **Slippage** | Maximale Preisabweichung bei Swap-Ausführung |
| **APK** | Android Package - Installationsdatei |
| **EAS** | Expo Application Services - Build-Infrastruktur |

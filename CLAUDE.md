# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Swap is a Solana mobile DApp built with Expo/React Native for iOS and Android. It provides a one-tap interface for token swaps using Jupiter's aggregation protocol.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run ios          # Run on iOS simulator (requires Xcode)
npm run android      # Run on Android emulator
npm run web          # Run in browser
npm run lint         # Run ESLint
```

## Architecture

### Navigation Flow
```
Home (wallet connection) → Swap (quote preview & execution) → History (past swaps)
```

Uses React Navigation native-stack, not expo-router file-based routing.

**Auto-login:** If a wallet session is persisted, the app skips Home and goes directly to Swap.
**Logout:** Long-press the wallet address badge in Swap to disconnect.

### Key Directories
- `app/screens/` - Screen components (Home.tsx, Swap.tsx, History.tsx)
- `app/wallet/` - Wallet adapter abstraction with mock/real toggle
- `app/jupiter/` - Jupiter API integration (config, quotes, token lists)
- `app/storage/` - AsyncStorage persistence (swap history, token cache, wallet auth)
- `app/hooks/` - Custom hooks (useSwapHistory, useTokenList)
- `app/components/` - Reusable UI components

### Wallet Integration
`app/wallet/wallet.ts` exports a wallet instance. Toggle `USE_MOCK` between MockWallet and real SolanaMobileWalletAdapter. MockWallet provides authorize/signTransactions/signMessage stubs for development.

### Jupiter Integration
`app/jupiter/quote.ts` calls Jupiter Swap API v1.

**API Key Setup (Required):**
1. Go to https://portal.jup.ag/
2. Create a free account (1 RPS limit)
3. Generate an API key
4. Add the key to `app/jupiter/config.ts`:
   ```typescript
   export const JUPITER_API_KEY = 'your-api-key-here';
   ```

The free tier allows 1 request per second, which is sufficient for development.

### Token Mints
- SOL: `So11111111111111111111111111111111111111112`
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## TypeScript

Path alias: `@/*` maps to project root. Strict mode enabled.

## Deep Linking

App scheme: `smartswap://`

Claude Code Projektregeln
Git Commits
Keine Co-Authored-By: Claude Zeile in Commits einfügen
Fundamentale Prinzipien für Bug-Freiheit
Diese Regeln gelten sprachunabhängig für alle Projekte.

1. Immutability als Fundament
Regel: Daten sind immutable. Keine Mutationen.

Durchsetzung:

Neue Objekte erzeugen statt bestehende zu ändern
Immutable-by-default Patterns verwenden (readonly, const, freeze)
Keine mutierenden Methoden auf Collections (push, splice, sort in-place)
Warum: Eliminiert Race Conditions, Side Effects, macht Debugging trivial.

2. Totale Funktionen (Total Functions)
Regel: Jede Funktion muss für JEDEN möglichen Input einen definierten Output haben.

Durchsetzung:

Keine Exceptions für erwartbare Fälle werfen
Leere/ungültige Inputs graceful behandeln (Rückgabe von Defaults, leeren Collections)
Edge Cases im Typ-System codieren, nicht in Runtime-Checks
Warum: Partielle Funktionen crashen bei Edge Cases. Totale Funktionen sind robust.

3. Vollständige Operationen (Keine TODO-Lücken)
Regel: Eine Operation ist erst "fertig", wenn sie ALLE Fälle behandelt.

Durchsetzung:

Keine // TODO in Business Logic
Code-Review: Alle Branches müssen sinnvolles Verhalten haben
Keine Silent Failures (return ohne Aktion)
Warum: Unvollständige Operationen sind die #1 Bug-Quelle.

4. Explizite State-Übergänge
Regel: Jeder State-Übergang ist explizit und nachvollziehbar.

Durchsetzung:

Keine globalen Flags für State-Management
Funktionen nehmen State als Input und geben neuen State zurück
Side Effects nur an den Rändern (I/O, UI)
Warum: Implizite State-Übergänge führen zu Race Conditions und sind nicht testbar.

5. Typsicherheit als Vertrag
Regel: Das Typ-System ist der Vertrag. Wenn es kompiliert, ist es korrekt.

Durchsetzung:

Strikte Compiler-Einstellungen aktivieren
Keine any/dynamic Types (außer an System-Grenzen)
Discriminated Unions statt String-Typen
Branded Types für Domain-IDs
Warum: Typ-System prüft Millionen von Kombinationen, Tests nur Hunderte.

6. Property-Based Testing für Invarianten
Regel: Neben Unit-Tests müssen Invarianten mit Property-Based Testing geprüft werden.

Durchsetzung:

Invarianten als Properties definieren
Zufallsgenerierte Inputs testen
1000+ Iterationen in CI
Warum: Unit-Tests prüfen bekannte Cases. Property-Based Tests finden unbekannte Edge Cases.

7. Synchroner, Deterministischer Flow
Regel: Der kritische Pfad ist synchron und deterministisch.

Durchsetzung:

Kern-Operationen sind synchron
Async nur für I/O (Server, Storage, externe APIs)
Keine Race Conditions durch async im kritischen Pfad
Warum: Async im Update-Flow macht State nicht-deterministisch.

8. Keine Silent Failures
Regel: Jede unerwartete Situation muss sichtbar sein.

Durchsetzung:

Explizite Null-Checks an Array/Collection-Zugriffen
Error Boundaries für unerwartete Zustände
Logging für Debug-Cases
Graceful Degradation mit sichtbarem Feedback
Warum: Silent Failures sind die schwierigsten Bugs.

9. Test-Pyramide einhalten
1
2
3
4
5
6
7
8
9
10
         ╱╲
        ╱  ╲         E2E Tests (wenige)
       ╱────╲        - Komplette User-Flows
      ╱      ╲       - Langsam, flaky
     ╱────────╲      Integration Tests (einige)
    ╱          ╲     - Komponenten zusammen
   ╱────────────╲    - I/O-Interaktion
  ╱              ╲   Unit Tests (viele)
 ╱────────────────╲  - Pure Functions
╱__________________╲ - Schnell, deterministisch
Regel: Die meisten Tests sind Unit-Tests auf Pure Functions.

Durchsetzung:

Core Logic: 90%+ Coverage mit Unit Tests
UI/Integration: Integration Tests
E2E: Nur für kritische User-Journeys
10. Defensive Boundaries
Regel: An System-Grenzen (User-Input, externe APIs, I/O) ist alles untrusted.

Durchsetzung:

Explizite Boundary-Funktionen für Parsing/Validation
Sanitization an jeder Boundary
Innerhalb des Systems: Trust the types
Warum: Bugs entstehen an Grenzen. Interne Daten sind durch das Typ-System geschützt.

Zusammenfassung: Checkliste
| Prinzip | Check |
|---------|-------|
| Immutability | Keine Mutationen, neue Objekte |
| Totale Funktionen | Kein throw für erwartbare Fälle |
| Vollständige Operations | Kein // TODO in Logic |
| Explizite State-Übergänge | Keine globalen Flags |
| Typsicherheit | Strict Mode, keine any |
| Property-Based Testing | Invarianten testen |
| Synchroner Flow | Kein async im kritischen Pfad |
| Keine Silent Failures | Explizite Fehlerbehandlung |
| Test-Pyramide | 90% Unit Tests |
| Defensive Boundaries | Validation an Grenzen |

Code-Hygiene
DRY (Don't Repeat Yourself)
Keine duplizierte Logik
Shared Utilities zentral definieren
Vor dem Schreiben einer Helper-Funktion: Prüfen ob sie existiert
Shared Operations
Operationen die von mehreren anderen gebraucht werden: eigenständige exportierte Funktionen
Keine private Duplikate in verschiedenen Modulen
Checkliste vor jedem Commit
[ ] Keine // TODO in Business Logic
[ ] Keine duplizierten Helper-Funktionen
[ ] Tests grün
[ ] Linting grün
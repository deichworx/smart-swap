# Component Diagram

## C4 Level 2: Container View

```mermaid
C4Container
    title Container Diagram - Smart Swap

    Person(user, "Benutzer")

    Container_Boundary(app, "Smart Swap App") {
        Container(screens, "Screens", "React Native", "Home, Swap UI")
        Container(components, "Components", "React Native", "Reusable UI")
        Container(wallet_mod, "Wallet Module", "TypeScript", "MWA Integration")
        Container(jupiter_mod, "Jupiter Module", "TypeScript", "Quote/Swap API")
    }

    System_Ext(wallet, "External Wallet")
    System_Ext(jupiter, "Jupiter API")

    Rel(user, screens, "Interagiert")
    Rel(screens, components, "Nutzt")
    Rel(screens, wallet_mod, "Autorisiert")
    Rel(screens, jupiter_mod, "Quotes")
    Rel(wallet_mod, wallet, "MWA")
    Rel(jupiter_mod, jupiter, "HTTPS")
```

## Modul-Struktur

```
app/
├── screens/                    # UI Layer
│   ├── Home.tsx               # Wallet Connection
│   └── Swap.tsx               # Quote & Swap Execution
│
├── components/                 # Shared Components
│   ├── Button.tsx             # Action Buttons
│   ├── TokenInput.tsx         # Amount Input
│   └── QuoteDisplay.tsx       # Quote Visualization
│
├── wallet/                     # Wallet Domain
│   ├── wallet.ts              # Wallet Export (Mock/Real Toggle)
│   ├── mwaWallet.ts           # MWA Implementation
│   └── mockWallet.ts          # Development Mock
│
├── jupiter/                    # Jupiter Domain
│   ├── quote.ts               # Quote API
│   └── swap.ts                # Swap Transaction Builder
│
├── polyfills.ts               # Platform Compatibility
└── app.tsx                    # App Entry Point
```

## Abhängigkeiten

```
┌─────────────────────────────────────────────────────────┐
│                      screens/                           │
│  ┌─────────────┐              ┌─────────────┐          │
│  │   Home.tsx  │              │  Swap.tsx   │          │
│  └──────┬──────┘              └──────┬──────┘          │
│         │                            │                  │
│         │         ┌──────────────────┤                  │
│         │         │                  │                  │
│         ▼         ▼                  ▼                  │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │   components/       │    │    wallet/          │    │
│  │   Button, Input     │    │    wallet.ts        │    │
│  └─────────────────────┘    └──────────┬──────────┘    │
│                                        │               │
│                              ┌─────────┴─────────┐     │
│                              │                   │     │
│                              ▼                   ▼     │
│                      ┌────────────┐      ┌────────────┐│
│                      │mwaWallet.ts│      │mockWallet  ││
│                      └────────────┘      └────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              External Dependencies                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  @solana-mobile/mobile-wallet-adapter-protocol  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  @solana/web3.js                                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Module Responsibilities

| Modul | Verantwortung | Abhängigkeiten |
|-------|---------------|----------------|
| `screens/Home` | Wallet-Verbindung initiieren | wallet, components |
| `screens/Swap` | Quote anzeigen, Swap ausführen | wallet, jupiter, components |
| `wallet/wallet` | Wallet-Instanz bereitstellen | mwaWallet oder mockWallet |
| `wallet/mwaWallet` | MWA Protocol Implementation | @solana-mobile/... |
| `jupiter/quote` | Quotes von Jupiter abrufen | fetch API |
| `jupiter/swap` | Swap-Transactions erstellen | @solana/web3.js |

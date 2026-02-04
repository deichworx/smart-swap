# System Context Diagram

## C4 Level 1: System Context

```mermaid
C4Context
    title System Context - Smart Swap

    Person(user, "Benutzer", "Solana Mobile Seeker User")

    System(smartswap, "Smart Swap", "One-Tap Token Swap DApp")

    System_Ext(wallet, "Wallet App", "Phantom, Solflare, Ultimate")
    System_Ext(jupiter, "Jupiter API", "DEX Aggregator")
    System_Ext(solana, "Solana Network", "Mainnet RPC")

    Rel(user, smartswap, "Nutzt", "Touch")
    Rel(smartswap, wallet, "Autorisiert & Signiert", "MWA Protocol")
    Rel(smartswap, jupiter, "Quotes & Swaps", "HTTPS/REST")
    Rel(wallet, solana, "Sendet Transaktionen", "JSON-RPC")
```

## Vereinfachte Darstellung (ASCII)

```
                    ┌─────────────────┐
                    │    Benutzer     │
                    │  (Seeker User)  │
                    └────────┬────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                      Smart Swap App                        │
│                                                            │
│  • Wallet Connection    • Quote Display    • Swap UI      │
└────────────────────────────────────────────────────────────┘
         │                      │                    │
         │ MWA                  │ REST              │
         ▼                      ▼                    │
┌─────────────────┐    ┌─────────────────┐          │
│   Wallet App    │    │   Jupiter API   │          │
│  (Phantom etc.) │    │  quote.jup.ag   │          │
└────────┬────────┘    └─────────────────┘          │
         │                                           │
         │ JSON-RPC                                  │
         ▼                                           │
┌─────────────────────────────────────────────────────┐
│              Solana Network (Mainnet)               │
└─────────────────────────────────────────────────────┘
```

## Schnittstellen

| Von | Nach | Protokoll | Daten |
|-----|------|-----------|-------|
| User | Smart Swap | Touch/UI | Amounts, Tap Events |
| Smart Swap | Wallet | MWA | Auth Requests, Transactions |
| Smart Swap | Jupiter | HTTPS | Quote Requests |
| Wallet | Solana | JSON-RPC | Signed Transactions |

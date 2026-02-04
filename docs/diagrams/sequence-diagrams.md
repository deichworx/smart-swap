# Sequence Diagrams

## 1. Wallet Connection Flow

```mermaid
sequenceDiagram
    actor User
    participant Home as Home Screen
    participant Wallet as wallet.ts
    participant MWA as mwaWallet.ts
    participant ExtWallet as External Wallet

    User->>Home: Tap "Connect Wallet"
    Home->>Wallet: authorize()
    Wallet->>MWA: authorize()
    MWA->>ExtWallet: transact() - authorize request

    Note over ExtWallet: User approves in Wallet App

    ExtWallet-->>MWA: authToken + publicKey
    MWA-->>MWA: Store authState
    MWA-->>Wallet: { publicKey }
    Wallet-->>Home: { publicKey }
    Home->>Home: Navigate to Swap Screen
```

## 2. Quote Request Flow

```mermaid
sequenceDiagram
    actor User
    participant Swap as Swap Screen
    participant Jupiter as jupiter/quote.ts
    participant API as Jupiter API

    User->>Swap: Enter amount
    Swap->>Swap: Debounce input
    Swap->>Jupiter: getQuote(amount)
    Jupiter->>API: GET /quote?inputMint=SOL&outputMint=USDC&amount=X

    alt Success
        API-->>Jupiter: Quote response
        Jupiter-->>Swap: Quote object
        Swap->>Swap: Display quote
    else API Error
        API-->>Jupiter: Error
        Jupiter-->>Swap: null
        Swap->>Swap: Show error message
    end
```

## 3. Swap Execution Flow

```mermaid
sequenceDiagram
    actor User
    participant Swap as Swap Screen
    participant Jupiter as jupiter/swap.ts
    participant API as Jupiter API
    participant Wallet as wallet.ts
    participant MWA as mwaWallet.ts
    participant ExtWallet as External Wallet
    participant Solana as Solana RPC

    User->>Swap: Tap "Swap"
    Swap->>Jupiter: getSwapTransaction(quote)
    Jupiter->>API: POST /swap
    API-->>Jupiter: Transaction (serialized)
    Jupiter-->>Swap: Transaction

    Swap->>Wallet: signAndSendTransaction(tx)
    Wallet->>MWA: signAndSendTransaction(tx)
    MWA->>ExtWallet: transact() - signAndSend request

    Note over ExtWallet: User confirms transaction

    ExtWallet->>Solana: Submit transaction
    Solana-->>ExtWallet: txSignature
    ExtWallet-->>MWA: txSignature
    MWA-->>Wallet: txSignature
    Wallet-->>Swap: txSignature

    Swap->>Swap: Show success + explorer link
```

## 4. Reauthorization Flow

```mermaid
sequenceDiagram
    participant App as Smart Swap
    participant MWA as mwaWallet.ts
    participant ExtWallet as External Wallet

    Note over App: App returns from background

    App->>MWA: signTransaction(tx)
    MWA->>MWA: Check authState exists

    alt Has authToken
        MWA->>ExtWallet: transact() - reauthorize
        ExtWallet-->>MWA: Confirmed
        MWA->>ExtWallet: signTransactions
        ExtWallet-->>MWA: Signed transaction
    else No authToken
        MWA-->>App: Error: "Wallet not connected"
        App->>App: Navigate to Home
    end
```

## 5. Error Handling Flow

```mermaid
sequenceDiagram
    actor User
    participant Swap as Swap Screen
    participant Wallet as wallet.ts
    participant ExtWallet as External Wallet

    User->>Swap: Tap "Swap"
    Swap->>Wallet: signAndSendTransaction(tx)

    alt User Rejects
        ExtWallet-->>Wallet: User rejected
        Wallet-->>Swap: Error
        Swap->>Swap: Show "Transaction cancelled"
    else Wallet Disconnected
        Wallet-->>Swap: Error: "Wallet not connected"
        Swap->>Swap: Navigate to Home
    else Insufficient Balance
        ExtWallet-->>Wallet: Insufficient SOL
        Wallet-->>Swap: Error
        Swap->>Swap: Show "Insufficient balance"
    else Network Error
        ExtWallet-->>Wallet: RPC Error
        Wallet-->>Swap: Error
        Swap->>Swap: Show "Network error, retry"
    end
```

## ASCII Sequence: Complete Swap Journey

```
User          Home         Swap         Jupiter      Wallet       Solana
 │             │            │             │            │            │
 │──Connect───>│            │             │            │            │
 │             │──authorize────────────────────────────>│            │
 │             │            │             │            │──approve──>│
 │             │<───────────authToken + pubkey─────────│            │
 │<──Navigate──│            │             │            │            │
 │             │            │             │            │            │
 │──Enter Amt─────────────->│             │            │            │
 │             │            │──getQuote──>│            │            │
 │             │            │<───quote────│            │            │
 │<─────────Show Quote──────│             │            │            │
 │             │            │             │            │            │
 │──Tap Swap──────────────->│             │            │            │
 │             │            │──getSwapTx─>│            │            │
 │             │            │<────tx──────│            │            │
 │             │            │──signSend───────────────>│            │
 │             │            │             │            │──submit───>│
 │             │            │             │            │<──txSig────│
 │             │            │<────────────txSig────────│            │
 │<─────────Success─────────│             │            │            │
 │             │            │             │            │            │
```

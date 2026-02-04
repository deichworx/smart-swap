# Mobile Wallet Adapter (MWA)

## Übersicht

MWA ist das Protokoll für Wallet-Interaktion auf Solana Mobile. Auf dem Seeker Device wird es durch den **Seed Vault** implementiert.

## Architektur

```
┌─────────────┐     MWA Protocol      ┌─────────────┐
│  Smart Swap │ ◄──────────────────► │  Seed Vault │
│    (App)    │   authorize/sign      │  (Wallet)   │
└─────────────┘                       └─────────────┘
        │
        ▼
┌─────────────┐
│ AsyncStorage│ ← Session Persistenz
└─────────────┘
```

## Implementation

### Dateien

| Datei | Zweck |
|-------|-------|
| `app/wallet/mwaWallet.ts` | MWA Implementation |
| `app/wallet/mockWallet.ts` | Mock für Entwicklung |
| `app/wallet/wallet.ts` | Export (Mock/Real Toggle) |
| `app/storage/index.ts` | Session Storage Operations |

### App Identity

```typescript
const APP_IDENTITY = {
  name: 'Smart Swap',
  uri: 'https://smartswap.app',
  icon: 'favicon.ico', // Relative URI required by MWA
};
```

Diese Daten werden dem User beim Autorisieren angezeigt.

### Verfügbare Methoden

```typescript
// Wallet verbinden (initial)
const { publicKey } = await wallet.authorize();

// Session wiederherstellen (App-Start)
const restored = await wallet.restoreSession(); // true/false

// EMPFOHLEN: Signieren und direkt senden
const signature = await wallet.signAndSendTransaction(tx);

// DEPRECATED: Einzelne Transaktion signieren
const signedTx = await wallet.signTransaction(tx);

// DEPRECATED: Mehrere Transaktionen signieren
const signedTxs = await wallet.signAllTransactions([tx1, tx2]);

// Verbindung trennen
await wallet.disconnect();
```

## Best Practice: signAndSendTransaction

**Solana Mobile Community Empfehlung:** Immer `signAndSendTransaction` verwenden.

```typescript
// EMPFOHLEN
const signature = await wallet.signAndSendTransaction(tx);

// VERMEIDEN
const signedTx = await wallet.signTransaction(tx);
const signature = await connection.sendTransaction(signedTx);
```

**Vorteile:**
- Wallet setzt Priority Fees automatisch
- Reduziert Replay-Attack-Risiko bei Durable Nonces
- Einzelne User-Bestätigung statt zwei Schritte
- Wallet kann Transaktionsstatus tracken

## Session Handling

### Session Persistenz

Auth Token wird in AsyncStorage gespeichert für Auto-Login:

```typescript
// Bei authorize()
await setWalletAuth({
  authToken: result.authToken,
  publicKeyBase64: result.publicKey.toBase58(),
});

// Bei App-Start
const restored = await wallet.restoreSession();
if (restored) {
  // Navigate to Swap
} else {
  // Navigate to Home
}
```

### Reauthorization

Vor jeder Transaction wird `reauthorize()` aufgerufen:

```typescript
await transact(async (wallet) => {
  // Token Freshness Check
  await wallet.reauthorize({
    auth_token: authState.authToken,
    identity: APP_IDENTITY,
  });

  // Dann Transaction signieren
  const signatures = await wallet.signAndSendTransactions({
    transactions: [transaction],
  });

  return signatures[0];
});
```

## CancellationException Handling

Die Wallet-App kann nach dem Signieren geschlossen werden, bevor die Antwort zurückkommt:

```typescript
try {
  return await transact(async (wallet) => {
    await wallet.reauthorize({...});
    const signatures = await wallet.signAndSendTransactions({...});
    return signatures[0];
  });
} catch (error) {
  // CancellationException = Wallet closed after signing
  if (error instanceof Error && error.message.includes('Cancellation')) {
    console.log('[Wallet] Session closed after signing (normal behavior)');
    throw new Error('Transaction sent - check wallet for confirmation');
  }
  throw error;
}
```

**Wichtig:** Die Transaction kann trotz Exception erfolgreich sein. Die UI sollte dem User mitteilen, dass er im Wallet nachschauen soll.

## Chains

| Chain ID | Netzwerk |
|----------|----------|
| `solana:mainnet` | Mainnet Beta |
| `solana:devnet` | Devnet |
| `solana:testnet` | Testnet |

## Testing

### Auf Emulator

1. Fake Wallet installieren:
```bash
cd /tmp
git clone --depth 1 https://github.com/solana-mobile/mobile-wallet-adapter.git
cd mobile-wallet-adapter/android
./gradlew :fakewallet:installLegacyDebug
```

2. Fake Wallet App öffnen
3. Smart Swap starten und "Connect Wallet"

### Auf Seeker

Seed Vault ist integriert - keine zusätzliche Installation nötig.

### Mock Wallet

Für UI-Entwicklung ohne Wallet:

```typescript
// app/wallet/wallet.ts
const USE_MOCK = true; // Mock aktivieren
```

## Troubleshooting

| Problem | Ursache | Lösung |
|---------|---------|--------|
| "No wallet found" | Keine Wallet-App | Fake Wallet installieren / Seed Vault einrichten |
| "User rejected" | User hat abgelehnt | Normales Verhalten |
| "Session expired" | Token abgelaufen | `authorize()` erneut aufrufen |
| CancellationException | Wallet nach Sign geschlossen | Prüfen ob TX trotzdem durch |
| Auto-Login funktioniert nicht | Session nicht gespeichert | AsyncStorage prüfen |

## Storage Keys

| Key | Inhalt | TTL |
|-----|--------|-----|
| `@wallet_auth` | `{ authToken, publicKeyBase64 }` | Bis Disconnect |

## Ressourcen

- [MWA Docs](https://docs.solanamobile.com/getting-started/overview)
- [MWA GitHub](https://github.com/solana-mobile/mobile-wallet-adapter)
- [Seed Vault Docs](https://docs.solanamobile.com/getting-started/seed-vault)
- [signAndSendTransaction Discussion](https://github.com/solana-mobile/mobile-wallet-adapter/discussions)

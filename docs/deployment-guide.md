# Smart Swap - Deployment Guide

## Zielplattform

**Solana dApp Store** auf Solana Mobile Seeker (Android)

---

## Voraussetzungen

### Konten

| Konto | Status | Kosten |
|-------|--------|--------|
| Expo Account | Erforderlich | Kostenlos |
| Solana Wallet mit SOL | Erforderlich | ~0.1 SOL für NFT-Minting |

### Tools

```bash
# Node.js 18+
node --version

# EAS CLI
npm install -g eas-cli

# Solana dApp Store CLI
npm install -g @solana-mobile/dapp-store-cli

# Solana CLI (optional, für Wallet-Management)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

---

## Projekt-Konfiguration

### Aktuelle Konfiguration

**app.json:**
- Package: `com.smartswap.app`
- Version: `1.0.0`
- Platform: Android only

**eas.json:**
- `development` - Lokales Testing (APK)
- `preview` - Internal Testing (APK)
- `production` - Release Build
- `dapp-store` - Solana dApp Store (APK)

---

## Build-Prozess

### 1. EAS Login

```bash
eas login
```

### 2. Credentials konfigurieren

```bash
# Erstellt neuen Android Keystore
eas credentials -p android
```

**WICHTIG:** Separaten Keystore für dApp Store verwenden!

### 3. Build starten

```bash
# Development Build (für Testing)
eas build --profile development --platform android

# dApp Store Build (für Release)
eas build --profile dapp-store --platform android
```

### 4. APK herunterladen

Nach erfolgreichem Build wird die Download-URL angezeigt.

---

## Solana dApp Store Publishing

### 1. Publisher initialisieren

```bash
cd /Users/hb/Projekte/solana/mobile/one-tap-dapp
dapp-store init
```

### 2. config.yaml ausfüllen

Datei bereits erstellt unter `/config.yaml`. Ausfüllen:

```yaml
publisher:
  address: "DEINE_SOLANA_WALLET_ADRESSE"
  email: "deine@email.com"

release:
  apk_path: "./path/to/smart-swap.apk"
```

### 3. Assets vorbereiten

```
assets/
├── images/
│   └── icon.png          # 512x512 px (vorhanden)
└── store/
    ├── screenshot-1.png  # 1920x1080 oder 1080x1920
    ├── screenshot-2.png
    ├── screenshot-3.png
    └── screenshot-4.png
```

**Screenshot-Anforderungen:**
- Minimum 4 Screenshots
- Format: PNG
- Auflösung: 1920x1080 (landscape) oder 1080x1920 (portrait)
- Zeige: Wallet Connect, Quote Screen, Swap Confirmation, Success

### 4. Validierung

```bash
dapp-store validate
```

### 5. Publishing

```bash
# Testet die Konfiguration ohne zu publishen
dapp-store publish --dry-run

# Tatsächliches Publishing (mintet NFTs)
dapp-store publish
```

**Kosten:** ~0.02-0.05 SOL für NFT-Minting

---

## Deployment Checklist

### Pre-Build

- [ ] Version in `app.json` aktualisiert
- [ ] `versionCode` inkrementiert
- [ ] config.yaml `publisher.address` gesetzt
- [ ] config.yaml `publisher.email` gesetzt
- [ ] 4+ Screenshots in `assets/store/`

### Build

- [ ] `eas build --profile dapp-store` erfolgreich
- [ ] APK heruntergeladen
- [ ] APK-Pfad in `config.yaml` gesetzt

### Testing

- [ ] APK auf Seeker/Emulator installiert
- [ ] Wallet Connect funktioniert
- [ ] Quote-Abruf funktioniert
- [ ] Swap-Signierung funktioniert
- [ ] Deep Link `smartswap://` öffnet App

### Publishing

- [ ] `dapp-store validate` ohne Fehler
- [ ] `dapp-store publish --dry-run` erfolgreich
- [ ] Solana Wallet hat genug SOL (~0.1)
- [ ] `dapp-store publish` ausgeführt

### Post-Publishing

- [ ] App im dApp Store sichtbar
- [ ] Installation aus Store funktioniert
- [ ] Funktionstest auf frischer Installation

---

## Version Updates

### Minor Update (Bug Fix)

1. Version in `app.json` erhöhen (z.B. 1.0.1)
2. `versionCode` inkrementieren
3. Release Notes in `config.yaml` aktualisieren
4. Build & Publish

### Major Update (Feature)

1. Version in `app.json` erhöhen (z.B. 1.1.0)
2. `versionCode` inkrementieren
3. Screenshots aktualisieren falls nötig
4. Release Notes in `config.yaml` aktualisieren
5. Build & Publish

---

## Troubleshooting

### Build schlägt fehl

```bash
# Cache leeren
eas build:clean

# Credentials neu generieren
eas credentials -p android --clear
```

### APK wird im dApp Store abgelehnt

- Prüfe ob APK mit Debug-Keystore signiert wurde
- Prüfe ob `android:debuggable="true"` entfernt wurde
- Validiere mit `dapp-store validate`

### Wallet Connect funktioniert nicht

- Prüfe ob MWA-fähige Wallet installiert ist (Phantom, Solflare)
- Prüfe Intent-Filter in `app.json`
- Teste mit Mock-Wallet im Development-Mode

---

## Referenzen

- [Solana Mobile Docs - dApp Publishing](https://docs.solanamobile.com/dapp-publishing/intro)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [dApp Store CLI Reference](https://docs.solanamobile.com/dapp-publishing/cli-reference)

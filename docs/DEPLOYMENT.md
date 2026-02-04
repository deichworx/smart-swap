# Smart Swap Deployment Guide

Diese Anleitung beschreibt das Deployment von Smart Swap auf Solana Mobile Geräte (Seeker/Saga).

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Entwicklungsumgebung](#entwicklungsumgebung)
3. [Build-Optionen](#build-optionen)
4. [Seeker Device Setup](#seeker-device-setup)
5. [Development Build](#development-build)
6. [Preview Build](#preview-build)
7. [Production Build](#production-build)
8. [dApp Store Submission](#dapp-store-submission)
9. [Troubleshooting](#troubleshooting)

---

## Voraussetzungen

### Software

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | >= 18.x | https://nodejs.org |
| npm | >= 9.x | Inkludiert in Node.js |
| EAS CLI | >= 5.x | `npm install -g eas-cli` |
| Android SDK | API 34+ | Android Studio |
| ADB | Latest | Android SDK Platform Tools |

### Accounts

- **Expo Account**: https://expo.dev/signup (kostenlos)
- **EAS Build**: Kostenlos für 30 Builds/Monat

### Hardware

- Solana Mobile Seeker oder Saga Device
- USB-Kabel (USB-C)
- Computer mit macOS, Windows oder Linux

---

## Entwicklungsumgebung

### 1. Projekt Setup

```bash
# Repository klonen
git clone <repository-url>
cd one-tap-dapp

# Dependencies installieren
npm install

# Environment Variables konfigurieren
cp .env.example .env
```

### 2. Environment Variables

Editiere `.env` mit deinen Werten:

```bash
# Jupiter API (optional, erhöht Rate Limits)
EXPO_PUBLIC_JUPITER_API_KEY=your-jupiter-api-key

# Solana RPC (WICHTIG für Production!)
EXPO_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key

# Platform Fee Wallet (optional)
EXPO_PUBLIC_FEE_ACCOUNT=your-solana-wallet-address
```

### 3. EAS Konfiguration

```bash
# Bei Expo einloggen
eas login

# Projekt mit EAS verbinden (einmalig)
eas build:configure
```

---

## Build-Optionen

| Profile | Zweck | Build-Zeit | Größe |
|---------|-------|------------|-------|
| `development` | Lokale Entwicklung mit Hot Reload | ~10 Min | ~80 MB |
| `preview` | Interner Test ohne Dev Tools | ~8 Min | ~40 MB |
| `production` | Release Build, optimiert | ~10 Min | ~35 MB |
| `dapp-store` | Solana dApp Store Submission | ~10 Min | ~35 MB |

---

## Seeker Device Setup

### 1. Developer Mode aktivieren

1. **Settings** öffnen
2. **About Phone** → **Build Number** 7x tippen
3. Zurück zu **Settings** → **Developer Options**
4. **USB Debugging** aktivieren

### 2. USB Verbindung

```bash
# Device verbinden und Verbindung prüfen
adb devices

# Erwartete Ausgabe:
# List of devices attached
# XXXXXXXXXX    device
```

Falls "unauthorized":
- Auf dem Seeker die USB-Debugging Berechtigung bestätigen
- "Always allow from this computer" aktivieren

### 3. Wallet Installation

Für MWA (Mobile Wallet Adapter) Tests:

```bash
# Phantom Wallet installieren (empfohlen)
# Download von: https://phantom.app/download

# Oder Solflare
# Download von: https://solflare.com/download
```

---

## Development Build

Der Development Build enthält Expo Dev Client für Hot Reload und Debugging.

### Option A: EAS Cloud Build

```bash
# Build starten
eas build --platform android --profile development

# Build Status verfolgen
eas build:list

# Nach Abschluss: APK-Link wird angezeigt
```

### Option B: Lokaler Build (schneller)

Voraussetzung: Android SDK installiert

```bash
# Direkt auf verbundenem Device bauen und installieren
npx expo run:android --device

# Oder APK lokal erstellen
npx expo run:android --variant release
```

### Development Workflow

```bash
# 1. Dev Server starten
npx expo start --dev-client

# 2. App auf Seeker öffnen
# 3. QR-Code scannen oder URL eingeben

# Hot Reload ist automatisch aktiv
# Shake Device für Dev Menu
```

---

## Preview Build

Preview Build für interne Tests ohne Development Tools.

```bash
# Build erstellen
eas build --platform android --profile preview

# Nach Abschluss: APK herunterladen
# Link wird in der Konsole angezeigt
```

### Installation auf Seeker

```bash
# APK auf Device installieren
adb install path/to/smart-swap-preview.apk

# Bei Update: -r Flag für Reinstall
adb install -r path/to/smart-swap-preview.apk
```

---

## Production Build

Optimierter Release Build für Production.

```bash
# Production Build erstellen
eas build --platform android --profile production
```

### Signing

Production Builds werden automatisch signiert. EAS verwaltet den Keystore.

```bash
# Keystore Credentials anzeigen
eas credentials

# Keystore herunterladen (für Backup)
eas credentials --platform android
```

---

## dApp Store Submission

Für die Veröffentlichung im Solana dApp Store.

### 1. Build erstellen

```bash
eas build --platform android --profile dapp-store
```

### 2. Voraussetzungen für Submission

- [ ] Privacy Policy URL (siehe `app/screens/Legal.tsx`)
- [ ] Terms of Service URL
- [ ] App Icon (512x512)
- [ ] Screenshots (mind. 3)
- [ ] App Description
- [ ] Keine Embedded Private Keys
- [ ] MWA korrekt implementiert

### 3. dApp Store Portal

1. https://dappstore.solanamobile.com besuchen
2. Mit Wallet anmelden
3. "Submit App" auswählen
4. APK hochladen
5. Metadata ausfüllen
6. Review abwarten (~1-2 Wochen)

### dApp Store Anforderungen

| Requirement | Status |
|-------------|--------|
| No Embedded Keys | ✅ |
| HTTPS Only | ✅ |
| MWA Integration | ✅ |
| Privacy Policy | ⚠️ Placeholder |
| Terms of Service | ⚠️ Placeholder |

---

## Troubleshooting

### Build Fehler

**"SDK location not found"**
```bash
# Android SDK Pfad setzen
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**"Build failed: Gradle error"**
```bash
# Cache leeren
cd android && ./gradlew clean
cd .. && npx expo start --clear
```

### Device Verbindung

**"Device unauthorized"**
```bash
# ADB Server neustarten
adb kill-server
adb start-server
adb devices
# Dann auf Device Berechtigung erteilen
```

**"Device offline"**
```bash
# USB-Modus auf Device prüfen
# Sollte "File Transfer" oder "MTP" sein, nicht "Charging only"
```

### App Fehler

**"Wallet connection failed"**
- Prüfen ob Phantom/Solflare installiert ist
- App-Berechtigungen prüfen
- Wallet-App neustarten

**"RPC rate limit exceeded"**
- Private RPC URL in `.env` konfigurieren
- Helius Free Tier: https://www.helius.dev

**"Quote fetch failed"**
- Internet-Verbindung prüfen
- Jupiter API Status: https://status.jup.ag

---

## Schnellreferenz

### Häufige Befehle

```bash
# Development
npm start                              # Expo Dev Server
npx expo run:android --device          # Lokaler Build + Install

# EAS Builds
eas build -p android --profile dev     # Development Build
eas build -p android --profile preview # Preview Build
eas build -p android --profile prod    # Production Build

# Device Management
adb devices                            # Verbundene Geräte
adb install app.apk                    # APK installieren
adb logcat | grep "SmartSwap"          # Logs anzeigen

# Debugging
npx expo start --dev-client --clear    # Cache leeren
eas build:list                         # Build History
eas credentials                        # Signing Keys
```

### Build Profile Übersicht (eas.json)

```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal",
    "android": { "buildType": "apk" }
  },
  "preview": {
    "distribution": "internal",
    "android": { "buildType": "apk" }
  },
  "production": {
    "autoIncrement": true
  },
  "dapp-store": {
    "channel": "production",
    "android": { "buildType": "apk" }
  }
}
```

---

## Weiterführende Links

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Solana Mobile Documentation](https://docs.solanamobile.com)
- [Mobile Wallet Adapter](https://docs.solanamobile.com/getting-started/overview)
- [Solana dApp Store](https://dappstore.solanamobile.com)
- [Jupiter API](https://station.jup.ag/docs)

---

*Letzte Aktualisierung: Januar 2026*

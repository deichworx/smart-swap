# Setup

## Voraussetzungen

- Node.js 18+
- Android Studio (für Emulator)
- Java 17 (für Android Build)
- Android SDK 34+

### Android Studio Setup

1. Android Studio installieren
2. SDK Manager öffnen: `Tools > SDK Manager`
3. Installieren:
   - Android 14 (API 34)
   - Android SDK Build-Tools 34
   - Android Emulator
   - Android SDK Platform-Tools

### Emulator erstellen

1. AVD Manager: `Tools > Device Manager`
2. "Create Device"
3. Pixel 7 oder ähnlich wählen
4. System Image: API 34 (x86_64)
5. Finish

## Installation

```bash
git clone <repo>
cd one-tap-dapp
npm install
```

## Android Projekt generieren

```bash
npx expo prebuild --platform android
```

Bei Änderungen an `app.json` oder nativen Dependencies:

```bash
npx expo prebuild --platform android --clean
```

## Entwicklung starten

```bash
npx expo run:android
```

**Wichtig:** Nicht `expo start` verwenden - das startet Expo Go, welches MWA nicht unterstützt.

### Hot Reload

Nach dem ersten Build reicht:

```bash
npm start
```

Dann `a` drücken für Android. Metro Bundler connected zur laufenden App.

## Emulator Testing

### Fake Wallet installieren

Für MWA-Testing auf dem Emulator:

```bash
cd /tmp
git clone --depth 1 https://github.com/solana-mobile/mobile-wallet-adapter.git
cd mobile-wallet-adapter/android
./gradlew :fakewallet:installLegacyDebug
```

### Testing Flow

1. Fake Wallet App auf Emulator öffnen
2. Smart Swap App starten
3. "Connect Wallet" drücken
4. Fake Wallet autorisiert automatisch

### Mock Wallet (ohne Fake Wallet)

Für reine UI-Entwicklung:

```typescript
// app/wallet/wallet.ts
const USE_MOCK = true;
```

## Seeker Device Testing

Auf echtem Seeker Device:

1. USB Debugging aktivieren
2. Device verbinden
3. `npx expo run:android --device`
4. Seed Vault ist integriert - keine Wallet-App nötig

## Troubleshooting

### Build Failed: Package not found

```bash
rm -rf android
npx expo prebuild --platform android --clean
```

### Metro: Port 8081 in use

```bash
npx expo start --clear --port 8082
```

### Emulator nicht erkannt

```bash
adb devices  # Sollte Emulator listen
adb kill-server && adb start-server
```

### Java Version falsch

```bash
java -version  # Sollte 17 sein

# macOS mit Homebrew:
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

## Scripts

| Command | Beschreibung |
|---------|--------------|
| `npm start` | Metro Bundler starten |
| `npm run android` | Android Build + Run |
| `npm run lint` | ESLint ausführen |
| `npx tsc --noEmit` | TypeScript Check |

# Store Assets Guide

## Benötigte Screenshots

Speichern unter: `assets/store/`

| Datei | Screen | Was zeigen |
|-------|--------|------------|
| `screenshot-1.png` | Home | Wallet Connect Button |
| `screenshot-2.png` | Swap | Amount eingegeben, Quote sichtbar |
| `screenshot-3.png` | Swap | Wallet Confirmation Dialog |
| `screenshot-4.png` | Swap | Success mit Transaction ID |

## Anforderungen

- **Format:** PNG
- **Auflösung:** 1080x1920 (Portrait) oder 1920x1080 (Landscape)
- **Minimum:** 4 Screenshots
- **Keine:** Mockups, nur echte App-Screenshots

## Screenshots erstellen

### Option A: Echtes Gerät (Seeker)

```bash
# App installieren
eas build --profile development --platform android
# APK auf Gerät installieren, dann Screenshots machen
```

### Option B: Emulator

```bash
# App starten
npx expo run:android

# Screenshot vom Emulator
adb exec-out screencap -p > screenshot-1.png
```

### Option C: Expo Go (eingeschränkt)

```bash
npx expo start
# Dann manuell Screenshot im Emulator: Cmd+S (Mac) / Ctrl+S (Windows)
```

## Screenshot-Tipps

1. **Clean State:** App frisch starten
2. **Realistische Daten:** Echte Token-Amounts zeigen
3. **Keine Debug-Info:** Release Build oder Debug-Banner ausblenden
4. **Status Bar:** Sollte sichtbar sein (zeigt echte App)

## Nach dem Erstellen

```bash
# Dateien prüfen
ls -la assets/store/

# Dann config.yaml validieren
dapp-store validate
```

## Icon Anforderungen

| Asset | Größe | Pfad | Status |
|-------|-------|------|--------|
| App Icon | 512x512 | `assets/images/icon.png` | ✅ Vorhanden |
| Feature Graphic | 1200x600 | `assets/store/feature-graphic.png` | Optional |

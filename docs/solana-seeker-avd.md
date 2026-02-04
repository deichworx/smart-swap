# Solana Seeker AVD Configuration

## Device Specs

| Spec | Value |
|------|-------|
| Display | 6.36" AMOLED |
| Resolution | 1200 x 2670 |
| Density | 460 dpi |
| Refresh Rate | 120 Hz |
| OS | Android 14 (API 34) |
| RAM | 8 GB |
| Storage | 128 GB |
| Processor | MediaTek Dimensity 7300 |

## AVD Location

```
~/.android/avd/Solana_Seeker.avd/
~/.android/avd/Solana_Seeker.ini
```

## Manual Recreation

Falls das AVD neu erstellt werden muss:

```bash
# 1. System Image installieren (falls nicht vorhanden)
sdkmanager "system-images;android-34-ext12;google_apis_playstore;arm64-v8a"

# 2. AVD erstellen
avdmanager create avd \
  -n Solana_Seeker \
  -k "system-images;android-34-ext12;google_apis_playstore;arm64-v8a" \
  -d pixel_7

# 3. Config anpassen (Seeker-Auflösung)
# Editiere ~/.android/avd/Solana_Seeker.avd/config.ini:
# hw.lcd.width = 1200
# hw.lcd.height = 2670
# hw.lcd.density = 460
```

## Starten

```bash
# Via Android Studio Device Manager
# oder CLI:
emulator -avd Solana_Seeker

# Mit der App:
npm run android
# Dann Solana_Seeker im Device-Picker wählen
```

## Wichtig für Testing

1. **Solflare installieren** - Im Emulator Play Store öffnen und Solflare installieren
2. **Wallet importieren** - Seed Phrase eingeben oder neues Wallet erstellen
3. **Mainnet SOL** - Für echte Swaps brauchst du SOL auf dem Wallet

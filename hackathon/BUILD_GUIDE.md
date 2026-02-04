# Smart Swap - Build Guide

## Prerequisites

### Required Tools

```bash
# Node.js 18+
node --version  # Should be v18.x or higher

# EAS CLI
npm install -g eas-cli

# Verify installation
eas --version
```

### Expo Account

1. Create account at [expo.dev](https://expo.dev)
2. Login via CLI:
```bash
eas login
```

---

## Build Profiles

The project has 4 build profiles configured in `eas.json`:

| Profile | Purpose | Output |
|---------|---------|--------|
| `development` | Dev builds with dev client | APK |
| `preview` | Internal testing | APK |
| `production` | App store release | AAB |
| `dapp-store` | Solana dApp Store | APK |

---

## Building for Hackathon

### Option 1: Cloud Build (Recommended)

```bash
# Build APK for dApp Store / Hackathon
eas build --platform android --profile dapp-store
```

This will:
1. Upload your code to Expo's build servers
2. Build the APK in the cloud
3. Provide a download link when complete

**Build time**: ~10-15 minutes

### Option 2: Local Build

```bash
# Requires Android SDK installed
eas build --platform android --profile dapp-store --local
```

---

## Environment Variables

Before building, ensure environment variables are set:

### Option A: EAS Secrets (Recommended for CI)

```bash
eas secret:create --name EXPO_PUBLIC_JUPITER_API_KEY --value "your-key"
eas secret:create --name EXPO_PUBLIC_RPC_URL --value "your-rpc-url"
```

### Option B: .env file (Local builds)

```bash
cp .env.example .env
# Edit .env with your values
```

---

## Build Commands

### Development Build (with dev tools)

```bash
eas build --platform android --profile development
```

### Preview Build (for testers)

```bash
eas build --platform android --profile preview
```

### Production Build (dApp Store)

```bash
eas build --platform android --profile dapp-store
```

---

## After Build Completes

### Download APK

```bash
# List recent builds
eas build:list

# Download specific build
eas build:download --id <build-id>
```

Or use the Expo dashboard: https://expo.dev/accounts/[your-username]/projects/smart-swap/builds

### Install on Device

```bash
# Via ADB
adb install smart-swap.apk

# Or transfer to device and install manually
```

---

## Troubleshooting

### Build Fails: Missing API Keys

Ensure environment variables are set:
```bash
eas secret:list
```

### Build Fails: Gradle Error

Clear cache and retry:
```bash
eas build --clear-cache --platform android --profile dapp-store
```

### APK Too Large

Check bundle size:
```bash
npx expo export --platform android
# Review output size
```

---

## Version Management

Before each release, update version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

The `dapp-store` profile has `autoIncrement: false` to give you manual control.

---

## dApp Store Submission

After building:

1. Download APK from Expo dashboard
2. Go to [Solana dApp Store Publisher Portal](https://publisher.solanamobile.com)
3. Create new listing
4. Upload APK
5. Fill in metadata:
   - App name: Smart Swap
   - Category: DeFi
   - Description: One-tap token swaps with 15-tier SKR loyalty
   - Screenshots: From `docs/screenshots/`

---

## Quick Reference

```bash
# Login
eas login

# Build for hackathon
eas build --platform android --profile dapp-store

# Check build status
eas build:list

# Download APK
eas build:download --id <build-id>

# View logs for failed build
eas build:view <build-id>
```

---

## Checklist Before Building

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Environment variables configured
- [ ] Version number updated (if new release)
- [ ] EAS logged in (`eas whoami`)

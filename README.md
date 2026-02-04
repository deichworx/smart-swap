# Smart Swap

**One-Tap Token Swaps on Solana Mobile**

[![Solana](https://img.shields.io/badge/Solana-Mobile-9945FF?style=flat&logo=solana)](https://solanamobile.com)
[![Jupiter](https://img.shields.io/badge/Powered%20by-Jupiter-green)](https://jup.ag)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Built for **Solana Mobile Seeker Hackathon - Monolith** (Mobile Category)

<p align="center">
  <img src="docs/screenshots/swap-screen.png" width="250" alt="Swap Screen" />
  <img src="docs/screenshots/loyalty-screen.png" width="250" alt="Loyalty Screen" />
  <img src="docs/screenshots/history-screen.png" width="250" alt="History Screen" />
</p>

---

## Overview

Smart Swap is a **native mobile application** for Solana that makes token swapping as simple as a double-tap. Built from the ground up for Seeker and the Solana dApp Store, it combines Jupiter's best-in-class aggregation with a unique 15-tier loyalty system.

### Key Features

- **One-Tap Swaps** - Double-tap confirmation for fast, safe trading
- **Jupiter Integration** - Best rates across all Solana DEXes
- **15-Tier Loyalty System** - Hold SKR tokens to reduce fees (0.25% → FREE)
- **Seeker NFT Bonus** - Extra -0.05% discount for SGT holders
- **Native Performance** - 60 FPS, haptic feedback, offline support
- **On-Chain History** - Track all swaps with Solscan links

---

## Hackathon Submission

**Category**: Mobile

| Criteria | Link |
|----------|------|
| Pitch Deck | [View](hackathon/PITCH_DECK.md) |
| Demo Video | [YouTube](#) |
| Technical Depth | [Documentation](hackathon/TECHNICAL_DEPTH.md) |
| Mobile Optimization | [Details](hackathon/MOBILE_OPTIMIZATION.md) |
| Solana Integration | [Architecture](hackathon/SOLANA_INTEGRATION.md) |
| Product Market Fit | [Analysis](hackathon/PRODUCT_MARKET_FIT.md) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native / Expo SDK 52 |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation (native-stack) |
| Wallet | Solana Mobile Wallet Adapter |
| DEX | Jupiter Aggregator API v1 |
| RPC | Helius (DAS API support) |

---

## SKR Loyalty Tiers

| Level | Tier | SKR Required | Fee |
|-------|------|--------------|-----|
| 1 | Explorer | 0 | 0.25% |
| 2 | Initiate | 1,000 | 0.23% |
| 3 | Seeker | 5,000 | 0.21% |
| 4 | Holder | 10,000 | 0.19% |
| 5 | Believer | 25,000 | 0.17% |
| 6 | Supporter | 50,000 | 0.15% |
| 7 | Advocate | 100,000 | 0.13% |
| 8 | Guardian | 150,000 | 0.11% |
| 9 | Champion | 250,000 | 0.09% |
| 10 | Elite | 400,000 | 0.07% |
| 11 | Master | 550,000 | 0.05% |
| 12 | Legend | 750,000 | 0.03% |
| 13 | Titan | 1,000,000 | 0.02% |
| 14 | Immortal | 1,500,000 | 0.01% |
| 15 | Mythic | 2,000,000 | FREE |

**Bonus**: Seeker Genesis Token (SGT) holders get an additional -0.05% discount!

---

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
# Clone the repository
git clone https://github.com/deichworx/smart-swap.git
cd smart-swap

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```env
EXPO_PUBLIC_JUPITER_API_KEY=your_jupiter_api_key
EXPO_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
EXPO_PUBLIC_SKR_MINT=ExQRYF7ha2C7dgJ9f1keMXwHpnJWub1A7jNJTQKDpump
```

Get a free Jupiter API key at [portal.jup.ag](https://portal.jup.ag)

### Running the App

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

---

## Project Structure

```
app/
├── screens/          # Screen components
│   ├── Home.tsx      # Wallet connection
│   ├── Swap.tsx      # Main swap interface
│   ├── History.tsx   # Transaction history
│   └── Loyalty.tsx   # SKR tier system
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── jupiter/          # Jupiter API integration
├── solana/           # Solana RPC utilities
├── wallet/           # Wallet adapter
└── storage/          # AsyncStorage persistence
```

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

**Test Results**: 79 tests passing

---

## Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK for dApp Store
eas build --platform android --profile dapp-store
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Smart Swap App                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │  Swap   │  │ History │  │   Loyalty   │ │
│  │ Screen  │  │ Screen  │  │   Screen    │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       └────────────┴──────────────┘         │
│                    │                         │
│  ┌─────────────────┴───────────────────┐   │
│  │         Core Services                │   │
│  │  • Jupiter Quote Engine             │   │
│  │  • Fee Tier Calculator              │   │
│  │  • SGT Detection (Helius DAS)       │   │
│  └─────────────────┬───────────────────┘   │
└────────────────────┼────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
┌─────────┐   ┌───────────┐   ┌───────────┐
│ Jupiter │   │  Solana   │   │    MWA    │
│   API   │   │    RPC    │   │  Wallet   │
└─────────┘   └───────────┘   └───────────┘
```

---

## Performance

- **App Size**: < 25 MB
- **Cold Start**: < 2 seconds
- **Frame Rate**: 60 FPS constant
- **Quote Refresh**: Auto-refresh every 10s

### Optimizations Applied

- Memoized list items (React.memo)
- Native driver animations
- O(1) balance lookups (Map)
- Virtualized token lists
- Pressable over TouchableOpacity

---

## Roadmap

- [x] Core swap functionality
- [x] 15-tier loyalty system
- [x] Seeker SGT detection
- [x] Transaction history
- [ ] Limit orders
- [ ] DCA (Dollar Cost Averaging)
- [ ] Price alerts
- [ ] Portfolio view

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Links

- [Jupiter](https://jup.ag) - DEX Aggregator
- [Solana Mobile](https://solanamobile.com) - Seeker & dApp Store
- [Helius](https://helius.dev) - RPC & DAS API

---

<p align="center">
  <b>Smart Swap</b> - The fastest way to swap on Seeker
</p>

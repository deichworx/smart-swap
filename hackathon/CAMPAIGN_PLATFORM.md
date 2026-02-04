# Smart Swap - Campaign Platform

## The One-Tap DeFi Loyalty DApp

Smart Swap is not just a swap app - it's a **DeFi loyalty infrastructure platform** that enables time-limited campaigns with different sponsor tokens.

---

## Vision

> **"Trade more. Pay less. Get rewarded."**

Smart Swap transforms every swap into an opportunity for rewards. Through our campaign system, token projects can partner with Smart Swap to:
- Drive trading volume for their tokens
- Build holder communities through tier-based incentives
- Distribute airdrops to active traders
- Create time-limited promotional events

---

## Campaign System Architecture

### Campaign Types

| Type | Duration | Purpose |
|------|----------|---------|
| **Perpetual** | Ongoing | Platform's core loyalty (OTD, SKR) |
| **Seasonal** | 1-3 months | Partner token promotions |
| **Event** | 1-4 weeks | Special occasions, launches |
| **Flash** | 24-72 hours | High-intensity trading events |

### Campaign Components

```typescript
type Campaign = {
  id: string;              // Unique identifier
  name: string;            // Display name
  tokenMint: string;       // Sponsor token
  tiers: FeeTier[];        // Custom tier structure
  startDate: Date;         // Campaign start
  endDate?: Date;          // undefined = perpetual
  rewards: CampaignReward[];
  bonuses: BonusCondition[];
};
```

### Countdown & Time Window

Every campaign displays:
- **Status Badge**: UPCOMING, ACTIVE, ENDED
- **Time Remaining**: "15d 4h remaining" or "Ongoing"
- **Progress Tracking**: How close to next tier

---

## Active Campaigns

### SKR Season 1 (Current)

The launch campaign featuring Seeker community token.

| Tier | SKR Required | Fee |
|------|--------------|-----|
| Explorer | 0 | 0.25% |
| Initiate | 1,000 | 0.23% |
| Seeker | 5,000 | 0.21% |
| ... | ... | ... |
| Mythic | 2,000,000 | FREE |

**Rewards:**
- Reduced fees on every swap
- Season 1 airdrop for top traders
- Seeker NFT bonus (-0.05%)

### OTD Perpetual (Platform Token)

Smart Swap's native governance token - "One Tap Dapp".

| Tier | OTD Required | Fee |
|------|--------------|-----|
| Tapper | 0 | 0.25% |
| Swapper | 100 | 0.20% |
| Trader | 1,000 | 0.15% |
| Pro | 10,000 | 0.10% |
| Whale | 100,000 | 0.05% |
| Legend | 1,000,000 | FREE |

**Benefits:**
- Permanent fee discounts
- Staking rewards
- Governance voting power

---

## Partnership Opportunities

### For Token Projects

**Why partner with Smart Swap?**
1. **Targeted Distribution**: Rewards go to active traders, not random wallets
2. **Volume Boost**: Tier system incentivizes holding AND trading
3. **Community Building**: Users become invested holders
4. **Mobile-First**: Reach the growing mobile trading audience

**Campaign Package:**
- Custom tier structure
- Branded campaign page
- Airdrop distribution system
- Analytics dashboard
- Marketing co-promotion

### Example Partner Campaigns

#### BONK Summer
- **Token**: BONK
- **Duration**: 3 months
- **Rewards**: Weekly BONK airdrops, Summer NFT

#### Jupiter Rewards
- **Token**: JUP
- **Duration**: Quarterly
- **Rewards**: Priority routing, 2x points

#### Star Atlas Season
- **Token**: ATLAS
- **Duration**: Q4 2026
- **Rewards**: POLIS tokens, Ship NFT raffle

---

## Revenue Model

### Fee Structure

| Component | Rate |
|-----------|------|
| Platform Base Fee | 0.25% |
| Tier Discount | -0% to -0.25% |
| Seeker Bonus | -0.05% |
| Minimum Fee | 0% (Mythic tier) |

### Fee Distribution

```
Platform Fees Collected
├── 50% → Treasury
├── 30% → Development
└── 20% → Token Buyback (OTD/SKR)
```

### Partner Revenue Share

For sponsored campaigns:
- Partner provides airdrop pool
- Smart Swap provides infrastructure
- Revenue share on increased volume

---

## Roadmap

### Phase 1: Launch (Now)
- [x] SKR Season 1 campaign
- [x] 15-tier loyalty system
- [x] Seeker NFT bonus
- [x] Campaign countdown UI

### Phase 2: OTD Token (Q2 2026)
- [ ] OTD token launch
- [ ] Staking mechanism
- [ ] Governance voting
- [ ] Multi-campaign support

### Phase 3: Partner Platform (Q3 2026)
- [ ] Partner dashboard
- [ ] Custom campaign creation
- [ ] Airdrop automation
- [ ] Analytics suite

### Phase 4: Expansion (Q4 2026)
- [ ] Cross-chain campaigns
- [ ] NFT integration
- [ ] Gamification features
- [ ] Leaderboards

---

## Technical Implementation

### Campaign Selection

```typescript
// Get currently active campaign
const campaign = getActiveCampaign();

// Calculate user's fee
const tier = getCampaignFeeTier(campaign, userBalance);
const fee = getCampaignEffectiveFee(campaign, balance, bonusChecker);
```

### Time Management

```typescript
// Check campaign status
const status = getCampaignStatus(campaign); // 'active' | 'upcoming' | 'ended'

// Get remaining time
const remaining = formatTimeRemaining(campaign); // "15d 4h remaining"
```

### Multi-Campaign Support

Users can participate in multiple campaigns simultaneously:
1. Base fee from primary campaign (OTD/SKR)
2. Bonus rewards from seasonal campaigns
3. Stacked benefits possible

---

## Why This Matters

### For Users
- **Clear Value**: Hold tokens → Pay less
- **Multiple Rewards**: Stack benefits from multiple campaigns
- **Gamification**: Progress through tiers, unlock achievements

### For Partners
- **Targeted Marketing**: Reach active DeFi users
- **Measurable Results**: Track volume, holders, retention
- **Low Risk**: Pay for results, not promises

### For Solana Ecosystem
- **Mobile Adoption**: Bring more users to Seeker
- **Token Utility**: Give tokens real use cases
- **Volume Growth**: More swaps = more ecosystem activity

---

## Summary

Smart Swap's campaign platform transforms the DEX experience from a utility into a rewards program. By partnering with token projects and offering time-limited campaigns, we create:

1. **Sustainable Revenue** - Fees fund development
2. **User Retention** - Tiers create stickiness
3. **Partner Value** - Targeted user acquisition
4. **Ecosystem Growth** - More active traders

**Smart Swap: The One-Tap DeFi Loyalty DApp**

# Smart Swap - Partnership & Revenue Model

## How Token Projects Apply for Campaigns

---

## 1. Partnership Application Process

### Step 1: Application Form

Token projects submit via web form or Discord:

```yaml
# Campaign Application
project_name: "BONK"
token_mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
token_symbol: "BONK"
contact_email: "team@bonk.dog"
twitter: "@bonikiez"
website: "https://bonk.dog"

campaign_type: "seasonal" # seasonal | event | flash
duration_weeks: 12
start_date: "2026-06-01"

# Budget
airdrop_pool_tokens: 10_000_000_000  # 10B BONK
airdrop_pool_usd: 50_000  # ~$50K value
marketing_budget_usd: 10_000  # Optional co-marketing

# Tier Structure (we provide defaults or they customize)
custom_tiers: true
tiers:
  - name: "Pup"
    min_tokens: 0
    fee_bps: 20
  - name: "BONK King"
    min_tokens: 1_000_000_000
    fee_bps: 0

# Goals
volume_target_usd: 1_000_000  # $1M total volume goal
holder_target: 5_000  # New BONK holders goal
```

### Step 2: Review & Approval

**Criteria:**
- Token has sufficient liquidity (>$100K)
- Active community (1K+ holders)
- No rug history / doxxed team preferred
- Reasonable tier structure

**Timeline:**
- Application review: 48 hours
- Approval/rejection: 72 hours
- Campaign setup: 1 week

### Step 3: Contract & Payment

**Partnership Agreement:**
1. Campaign fee (see revenue below)
2. Airdrop tokens transferred to escrow wallet
3. Marketing commitments from both sides
4. Analytics access

---

## 2. Technical Implementation

### Campaign Registry (On-Chain)

```typescript
// Solana Program for Campaign Registry
type CampaignAccount = {
  authority: PublicKey;      // Smart Swap multisig
  sponsor: PublicKey;        // Partner project wallet
  tokenMint: PublicKey;      // Campaign token
  escrowVault: PublicKey;    // Airdrop tokens held here
  startSlot: u64;
  endSlot: u64;
  tierConfig: TierConfig[];
  totalAirdropPool: u64;
  distributedAmount: u64;
  status: CampaignStatus;    // Pending | Active | Ended | Cancelled
};
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Campaign Management                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Partner Portal (Web)                                      │
│   ├── Application Form                                      │
│   ├── Campaign Dashboard                                    │
│   ├── Analytics View                                        │
│   └── Airdrop Distribution                                  │
│                                                             │
│   Admin Backend                                             │
│   ├── Application Review Queue                              │
│   ├── Campaign Approval Workflow                            │
│   ├── Escrow Management                                     │
│   └── Revenue Tracking                                      │
│                                                             │
│   Smart Contracts                                           │
│   ├── Campaign Registry Program                             │
│   ├── Escrow Program (holds airdrop tokens)                │
│   ├── Distribution Program (claims/airdrops)               │
│   └── Fee Collection Program                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints

```typescript
// Partner Portal API
POST /api/campaigns/apply       // Submit application
GET  /api/campaigns/:id/status  // Check application status
POST /api/campaigns/:id/fund    // Fund escrow with tokens
GET  /api/campaigns/:id/stats   // Real-time analytics

// Admin API
GET  /api/admin/applications    // Review queue
POST /api/admin/approve/:id     // Approve campaign
POST /api/admin/reject/:id      // Reject with feedback
POST /api/admin/distribute/:id  // Trigger airdrop

// Mobile App API
GET  /api/campaigns/active      // Get active campaigns
GET  /api/campaigns/:id/tiers   // Get tier structure
GET  /api/user/:wallet/tier     // User's current tier
```

### Airdrop Distribution

**Options:**

1. **Volume-Based Airdrops**
   - Track user swap volume during campaign
   - Weekly distribution proportional to volume
   - Automatic via Solana program

2. **Tier Achievement Airdrops**
   - Bonus when user reaches new tier
   - One-time per tier per campaign
   - Claimable via app

3. **Random Raffle**
   - All eligible users entered
   - Random selection at campaign end
   - NFT or token prizes

```typescript
// Distribution calculation
function calculateAirdrop(user: UserStats, campaign: Campaign): number {
  const userVolume = user.totalVolumeUsd;
  const totalVolume = campaign.totalVolumeUsd;
  const poolSize = campaign.airdropPool;

  // Pro-rata distribution
  return (userVolume / totalVolume) * poolSize;
}
```

---

## 3. Revenue Model for Smart Swap

### Revenue Streams

#### A. Campaign Setup Fee

| Campaign Type | Duration | Setup Fee (USD) | Token Payment |
|---------------|----------|-----------------|---------------|
| Flash | 1-3 days | $500 | $750 equiv. in tokens |
| Event | 1-4 weeks | $2,000 | $2,500 equiv. in tokens |
| Seasonal | 1-3 months | $5,000 | $6,000 equiv. in tokens |
| Perpetual | Ongoing | $10,000 + monthly | Negotiated token allocation |

**Token Payment Option:**
- Partners can pay in their own tokens (25% premium for token risk)
- Tokens held in team treasury for 6 months minimum
- Potential upside if token appreciates
- Example: BONK campaign pays 15B BONK (~$7,500) instead of $5,000 USD

#### B. Jupiter Referral Fees

**Jupiter Referral Program:**
- Jupiter offers referral fees to integrators
- Current rate: **0.1% of swap volume** (100 bps) as referral fee
- Smart Swap receives this on every swap routed through Jupiter

**Jupiter Fee Revenue Calculation:**

| Monthly Volume | Jupiter Referral (0.1%) | Annual |
|----------------|-------------------------|--------|
| $100K | $100/month | $1,200 |
| $500K | $500/month | $6,000 |
| $1M | $1,000/month | $12,000 |
| $5M | $5,000/month | $60,000 |
| $10M | $10,000/month | $120,000 |

**Realistic Projection (Year 1):**
- Month 1-3: $50K volume → $50/month
- Month 4-6: $200K volume → $200/month
- Month 7-9: $500K volume → $500/month
- Month 10-12: $1M volume → $1,000/month
- **Year 1 Total: ~$5,250 from Jupiter alone**

#### C. Platform Fee (On Top of Jupiter)

**Our Platform Fee (in addition to Jupiter referral):**
- Base fee: 0.01% - 0.25% (based on tier)
- This is separate from Jupiter's referral

**Combined Revenue per Swap:**
```
User swaps $1,000 USDC → SOL

Jupiter referral:     $1.00  (0.1%)
Platform fee (avg):   $1.50  (0.15%)
────────────────────────────────
Total to Smart Swap:  $2.50  (0.25%)
```

#### D. Token Payments from Partners

**Instead of USD, partners can pay in:**

| Payment Type | Example | Benefit |
|--------------|---------|---------|
| Airdrop allocation | 5% of campaign airdrop pool | Immediate value |
| Token grant | 100K tokens vested 12 months | Long-term upside |
| Revenue share | 20% of campaign fees | Aligned incentives |
| NFT allocation | 10 exclusive NFTs | Collectible value |

**Team Token Treasury:**
- Hold partner tokens minimum 6 months
- Diversified exposure to Solana ecosystem
- Potential 2-10x if partner tokens succeed
- Quarterly review for rebalancing

#### E. Marketing Package (Optional)

| Package | Price (USD) | Price (Tokens) | Includes |
|---------|-------------|----------------|----------|
| Basic | $0 | Free | In-app listing only |
| Standard | $2,500 | $3,000 equiv. | + Social media promotion |
| Premium | $10,000 | $12,000 equiv. | + Homepage feature, push notifications |

### Revenue Projection

**Per Campaign (Seasonal, $50K airdrop budget):**

```
Setup Fee (tokens):     $6,000  (paid in partner tokens)
Jupiter Referral:       $1,000  (0.1% of $1M volume)
Platform Fees:          $1,350  (0.15% avg of $1M volume)
Marketing Package:      $3,000  (Standard, in tokens)
Token Allocation:       $2,500  (5% of airdrop pool)
─────────────────────────────────
Total per Campaign:     ~$13,850 (mix of USD + tokens)
```

**Annual Projection (12 campaigns + organic volume):**

```
Campaign Revenue:
12 campaigns × $13,850 = $166,200 / year

Jupiter Referral (organic):
$500K avg monthly × 0.1% × 12 = $6,000 / year

Token Treasury Appreciation (conservative 50%):
$100K in tokens × 1.5 = $50,000 gain

Year 1 Total: ~$220,000
────────────────────────────

With growth:
Year 1:  12 campaigns + organic  →  $220K
Year 2:  24 campaigns + 2x volume → $500K
Year 3:  48 campaigns + 5x volume → $1.2M
```

### Jupiter Integration Details

**How to Set Up Jupiter Referral:**

```typescript
// In quote request, add referral account
const quoteParams = {
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1000000000,
  // Add referral account
  platformFeeBps: 25, // 0.25% platform fee
  feeAccount: 'SmartSwapFeeAccount...', // Our fee collection wallet
};

// Jupiter automatically routes fees to feeAccount
```

**Fee Collection:**
- Fees collected in output token of each swap
- Weekly conversion to USDC/SOL
- Automatic via Jupiter's fee account system

---

## 4. Partner Benefits

### What Partners Get

1. **Exposure**
   - Featured in Smart Swap app
   - Access to mobile-first DeFi users
   - Seeker device owner audience

2. **Analytics**
   - Real-time volume tracking
   - Holder count monitoring
   - Tier distribution data
   - Geographic breakdown

3. **Marketing**
   - Co-branded announcements
   - Social media promotion
   - Newsletter features
   - Community AMAs

4. **Flexible Distribution**
   - Choose airdrop strategy
   - Set custom tier thresholds
   - Time-limited exclusives

### ROI for Partners

**Example: $50K Airdrop Investment**

```
Direct Costs:
- Airdrop tokens: $50,000
- Setup fee: $5,000
- Marketing: $2,500
Total: $57,500

Potential Returns:
- New holders: 5,000 users
- Avg. holding value: $100
- Total TVL increase: $500,000
- Trading volume: $1,000,000

Marketing Value:
- Impressions: 100,000+
- Social mentions: 500+
- PR coverage: $10,000+ equivalent

CAC: $57,500 / 5,000 users = $11.50 per user
(Typical crypto CAC: $50-200)
```

---

## 5. Example Campaign Packages

### Starter Package - $5,000

- 4-week campaign
- Basic tier structure (5 levels)
- In-app listing
- Weekly analytics report
- Up to $25K airdrop pool

### Growth Package - $15,000

- 12-week campaign
- Custom tier structure (up to 10 levels)
- Standard marketing package
- Real-time analytics dashboard
- Push notification feature (1x)
- Up to $100K airdrop pool

### Enterprise Package - $50,000+

- Perpetual or custom duration
- Fully custom tier structure
- Premium marketing package
- Dedicated account manager
- API access for own dashboard
- Co-development of features
- Unlimited airdrop pool
- Revenue share model

---

## 6. Implementation Roadmap

### Phase 1: Manual (Now - Q2 2026)
- Google Form applications
- Manual review process
- Direct token transfers
- Basic analytics in Notion

### Phase 2: Portal (Q3 2026)
- Web-based partner portal
- Automated application flow
- Self-service tier configuration
- Basic analytics dashboard

### Phase 3: Automated (Q4 2026)
- On-chain campaign registry
- Escrow smart contracts
- Automated airdrop distribution
- Real-time analytics API

### Phase 4: Marketplace (2026)
- Open campaign marketplace
- Bidding for premium slots
- Community-voted campaigns
- Cross-chain support

---

## Summary

**For Partners:**
- Low-risk, high-reward marketing channel
- Access to engaged mobile DeFi users
- Measurable results and analytics

**For Smart Swap:**
- Diversified revenue streams
- Network effects (more campaigns = more users = more campaigns)
- Sustainable business model

**Revenue per Year (Conservative):**
- Year 1: $100K - $150K
- Year 2: $200K - $300K
- Year 3: $400K - $600K

**Key Metrics to Track:**
- Campaigns per month
- Average campaign value
- Partner retention rate
- Volume per campaign
- User acquisition per campaign

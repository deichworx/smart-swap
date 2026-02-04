---
name: smart-swap-branding
description: Applies Smart Swap's official brand colors, typography, and design tokens. Use when creating UI components, styling screens, or ensuring visual consistency across the app.
---

# Smart Swap Brand Guidelines

Import design tokens from `app/theme.ts` - never hardcode values.

```typescript
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/app/theme';
```

## Colors

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `colors.bg.primary` | `#0D0D0D` | Main app background |
| `colors.bg.secondary` | `#141414` | Section backgrounds |
| `colors.bg.tertiary` | `#1A1A1A` | Elevated surfaces |
| `colors.bg.card` | `#1E1E1E` | Card backgrounds |

### Accent (Solana Brand)
| Token | Value | Usage |
|-------|-------|-------|
| `colors.accent.purple` | `#9945FF` | Primary accent, CTAs |
| `colors.accent.purpleLight` | `#B77DFF` | Hover/pressed states |
| `colors.accent.green` | `#14F195` | Success, positive values |
| `colors.accent.greenDark` | `#0EA66E` | Pressed green states |
| `colors.accent.gradient` | `['#9945FF', '#14F195']` | Hero elements, branding |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `colors.text.primary` | `#FFFFFF` | Headings, important text |
| `colors.text.secondary` | `#A0A0A0` | Body text, descriptions |
| `colors.text.tertiary` | `#666666` | Disabled, hints |
| `colors.text.inverse` | `#0D0D0D` | Text on light backgrounds |

### Status (WCAG AA Compliant)
| Token | Value | Usage |
|-------|-------|-------|
| `colors.status.success` | `#14F195` | Success messages |
| `colors.status.successBg` | `rgba(20, 241, 149, 0.1)` | Success background |
| `colors.status.error` | `#FF6B6B` | Error messages |
| `colors.status.errorBg` | `rgba(255, 107, 107, 0.1)` | Error background |
| `colors.status.warning` | `#FFD166` | Warning messages |
| `colors.status.warningBg` | `rgba(255, 209, 102, 0.1)` | Warning background |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `colors.border.primary` | `#2A2A2A` | Default borders |
| `colors.border.secondary` | `#333333` | Emphasized borders |
| `colors.border.focus` | `#9945FF` | Focus rings |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `spacing.xs` | 4 | Tight spacing, icons |
| `spacing.sm` | 8 | Compact elements |
| `spacing.md` | 16 | Default spacing |
| `spacing.lg` | 24 | Section spacing |
| `spacing.xl` | 32 | Large gaps |
| `spacing.xxl` | 48 | Hero sections |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `borderRadius.sm` | 8 | Buttons, inputs |
| `borderRadius.md` | 12 | Cards, containers |
| `borderRadius.lg` | 16 | Modals, sheets |
| `borderRadius.xl` | 24 | Hero elements |
| `borderRadius.full` | 9999 | Pills, avatars |

## Typography

### Font Sizes
| Token | Value | Usage |
|-------|-------|-------|
| `fontSize.xs` | 12 | Captions, labels |
| `fontSize.sm` | 14 | Secondary text |
| `fontSize.md` | 16 | Body text |
| `fontSize.lg` | 20 | Subheadings |
| `fontSize.xl` | 24 | Section titles |
| `fontSize.xxl` | 32 | Page titles |
| `fontSize.hero` | 40 | Hero text |

### Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| `fontWeight.normal` | 400 | Body text |
| `fontWeight.medium` | 500 | Emphasized text |
| `fontWeight.semibold` | 600 | Subheadings |
| `fontWeight.bold` | 700 | Headings, CTAs |

## Usage Examples

### Button Style
```typescript
const buttonStyle = {
  backgroundColor: colors.accent.purple,
  borderRadius: borderRadius.sm,
  padding: spacing.md,
};
```

### Card Style
```typescript
const cardStyle = {
  backgroundColor: colors.bg.card,
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderColor: colors.border.primary,
  padding: spacing.lg,
};
```

### Text Hierarchy
```typescript
const headingStyle = {
  color: colors.text.primary,
  fontSize: fontSize.xl,
  fontWeight: fontWeight.bold,
};

const bodyStyle = {
  color: colors.text.secondary,
  fontSize: fontSize.md,
  fontWeight: fontWeight.normal,
};
```

# Smart Swap - Mobile Optimization

## Built Mobile-First, Not Mobile-Ported

Smart Swap is a **native mobile application**, not a web app wrapped in a WebView. Every design decision prioritizes the mobile experience.

---

## UI/UX Optimizations

### Touch-Optimized Interface

| Element | Minimum Size | Smart Swap |
|---------|-------------|------------|
| Touch targets | 44×44 pt | 48×48 pt |
| Button padding | 12 pt | 16 pt |
| List item height | 44 pt | 56 pt |

### Thumb-Friendly Layout

- Primary actions at bottom of screen (swap button)
- Navigation elements within thumb reach
- Token selector opens as bottom sheet
- No need to reach top corners for critical actions

### Haptic Feedback

```typescript
// Contextual haptics for different actions
Haptics.impactAsync(ImpactFeedbackStyle.Light);   // First tap
Haptics.impactAsync(ImpactFeedbackStyle.Heavy);   // Confirmation
Haptics.notificationAsync(NotificationType.Success); // Swap complete
Haptics.notificationAsync(NotificationType.Error);   // Error
```

### Dark Theme

- Optimized for OLED screens (true black backgrounds)
- Reduces battery consumption
- Easier on eyes in low-light conditions
- Accent colors: Purple (#9945FF), Green (#14F195)

---

## Performance Optimizations

### App Size

- **Target**: < 25 MB APK
- Tree-shaking unused dependencies
- Optimized assets (compressed images)
- No heavy native modules

### Startup Time

- **Target**: < 2 seconds cold start
- Lazy loading non-critical screens
- Session restoration from AsyncStorage
- Minimal initial network requests

### Frame Rate

- **Target**: 60 FPS constant
- Native driver animations only
- Memoized list items
- No JavaScript thread blocking

### Memory Usage

- Virtualized lists (SectionList with `removeClippedSubviews`)
- Image caching with size limits
- Proper cleanup in useEffect hooks

---

## React Native Best Practices Applied

### ✅ `ui-pressable` - Modern Pressable API

```typescript
// ❌ Old way
<TouchableOpacity onPress={handlePress}>

// ✅ Smart Swap way
<Pressable
  onPress={handlePress}
  style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
>
```

### ✅ `list-performance-item-memo` - Memoized List Items

```typescript
const TokenRow = memo(function TokenRow({ item, onSelect }: Props) {
  // Only re-renders when props actually change
});

const SwapHistoryCard = memo(function SwapHistoryCard({
  inputSymbol,  // Primitives, not functions
  outputSymbol,
  // ...
}: Props) {
  // Effective memoization
});
```

### ✅ `list-performance-callbacks` - Stable Callbacks

```typescript
// Callbacks moved into memoized child components
const TokenRow = memo(function TokenRow({ item, onSelect }: Props) {
  const handlePress = useCallback(() => onSelect(item), [onSelect, item]);
  return <Pressable onPress={handlePress}>...</Pressable>;
});
```

### ✅ `animation-gpu-properties` - GPU Animations

```typescript
// ❌ Layout animation (JS thread)
style={{ width: animatedWidth }}

// ✅ Transform animation (GPU)
style={{ transform: [{ scaleX: progressAnim }] }}
useNativeDriver: true
```

### ✅ `navigation-native-navigators` - Native Stack

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Native stack uses platform navigation (iOS UINavigationController, Android Fragment)
// vs. JS-based stack that animates views in JavaScript
```

### ✅ O(1) Data Lookups

```typescript
// ❌ O(n) lookup in list render
const balance = ownedTokens.find(t => t.mint === mint)?.amount;

// ✅ O(1) lookup with Map
const balanceByMint = useMemo(() => new Map(
  ownedTokens.map(t => [t.mint, t.amount])
), [ownedTokens]);
const balance = balanceByMint.get(mint);
```

---

## Network Optimization

### Request Batching

- Parallel fetches for SKR balance + SGT status
- Single quote request per input change (debounced)

### Caching Strategy

```typescript
// Token list cached for 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// Balances cached per session, refreshed on modal open
useEffect(() => {
  if (modalVisible) {
    refreshBalances();
  }
}, [modalVisible]);
```

### Offline Handling

```typescript
const { isConnected } = useNetworkStatus();

// Show banner when offline
{!isConnected && (
  <View style={styles.offlineBanner}>
    <Text>No internet connection</Text>
  </View>
)}

// Prevent actions that require network
if (!isConnected) {
  setTxError('No internet connection');
  return;
}
```

### Quote Staleness

- Auto-refresh every 10 seconds
- Visual indicator shows quote age
- Stale quotes (>8s) highlighted in warning color

---

## Battery Optimization

### Minimal Background Work

- No background services
- Polling pauses when app backgrounded
- No wake locks

### Efficient Animations

- Native driver for all animations
- No continuous JS-thread animations
- Confetti uses Reanimated worklets

### Network Efficiency

- Requests only when needed
- Debounced inputs (500ms)
- No polling when paused (during tx)

---

## Accessibility

### VoiceOver / TalkBack Support

```typescript
<Pressable
  accessibilityLabel={`${item.symbol}, ${item.name}`}
  accessibilityRole="button"
  accessibilityHint="Tap to select, long press to favorite"
  accessibilityState={{ selected: isSelected }}
>
```

### Dynamic Text Sizes

- Uses relative font sizes from theme
- Layouts adapt to larger text settings

### Color Contrast

- All text meets WCAG AA contrast ratio
- Status colors (success/error) distinguishable

---

## Seeker Hardware Optimization

### Targeting Seeker Specs

- **Snapdragon 6 Gen 1** - Optimized for mid-range performance
- **6.36" Display** - Layouts tested at this size
- **4500 mAh Battery** - Battery-efficient design

### Memory Considerations

- Aggressive list virtualization
- Image size limits
- Component unmounting on navigation

---

## Testing on Real Devices

### Tested Configurations

| Device | OS | Result |
|--------|-----|--------|
| Pixel 7 | Android 14 | ✅ 60 FPS |
| Samsung S23 | Android 14 | ✅ 60 FPS |
| iPhone 14 | iOS 17 | ✅ 60 FPS |
| Saga (Gen 1) | Android 13 | ✅ 60 FPS |

### Performance Metrics

```bash
# Android - Measure startup time
adb shell am start-activity -W com.smartswap.app/.MainActivity

# React Native - Perf monitor
npx react-native start --reset-cache
# Shake device > Show Perf Monitor
```

---

## Checklist: Mobile Optimization

- [x] Native app (not WebView wrapper)
- [x] Touch targets ≥ 44pt
- [x] Thumb-friendly layout
- [x] Haptic feedback
- [x] Dark theme (OLED optimized)
- [x] < 2s cold start
- [x] 60 FPS animations
- [x] Memoized list items
- [x] Native driver animations
- [x] O(1) data lookups
- [x] Offline handling
- [x] Quote staleness indicator
- [x] Accessibility labels
- [x] Real device testing

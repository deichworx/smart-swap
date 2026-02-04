---
name: ui-ux-audit-mobile-android
description: UI/UX audit for Android mobile apps built with React Native/Expo. Applies Nielsen's heuristics, Material Design 3, WCAG accessibility, and platform-specific best practices. Use when reviewing screens, user flows, or preparing for design QA on Android.
---

# UI/UX Audit Skill (Android / React Native / Expo)

This skill guides a comprehensive UI/UX audit for Android mobile apps, producing an RFC from a UI/UX expert perspective.

**Expert Sources:**
- **Jakob Nielsen** - 10 Usability Heuristics
- **Material Design 3** - Google's Android design system
- **WCAG 2.1** - Web Content Accessibility Guidelines

## When to Use

**Trigger conditions:**
- User mentions UI audit, UX review, or design review
- User wants to evaluate a screen or user flow
- User asks about Material Design compliance
- User mentions accessibility review or a11y audit
- User wants to prepare for design QA

**Initial offer:**
Offer a structured 6-stage audit workflow. Explain that this approach applies:
1. Nielsen's heuristics for usability
2. Material Design 3 for Android consistency
3. WCAG 2.1 for accessibility
4. React Native/Expo platform specifics

---

## Stage 1: Heuristic Evaluation (Nielsen)

**Goal:** Apply Nielsen's 10 usability heuristics to identify interaction issues.

### The 10 Heuristics

| # | Heuristic | What to Check |
|---|-----------|---------------|
| 1 | **Visibility of system status** | Loading states, progress indicators, feedback on actions |
| 2 | **Match between system and real world** | Language, metaphors, logical order |
| 3 | **User control and freedom** | Undo, cancel, back navigation, exit paths |
| 4 | **Consistency and standards** | Platform conventions, internal consistency |
| 5 | **Error prevention** | Confirmations, constraints, smart defaults |
| 6 | **Recognition over recall** | Visible options, contextual help, clear labels |
| 7 | **Flexibility and efficiency** | Shortcuts, customization, accelerators |
| 8 | **Aesthetic and minimalist design** | Signal-to-noise ratio, visual hierarchy |
| 9 | **Help users recognize/recover from errors** | Clear error messages, solutions offered |
| 10 | **Help and documentation** | Onboarding, tooltips, searchable help |

### Questions to Ask

For each screen/flow:
- Is the user always aware of system state?
- Can users easily undo or escape?
- Are error messages actionable?
- Is the design free of unnecessary elements?

### Deliverable

A table rating each heuristic (Pass / Minor / Major / Critical) with specific observations.

---

## Stage 2: Material Design 3 Audit

**Goal:** Verify adherence to Google's Material Design 3 system.

### MD3 Checklist

| Category | What to Check |
|----------|---------------|
| **Color System** | Primary, secondary, tertiary roles; dynamic color support; surface tones |
| **Typography Scale** | Display, headline, title, body, label sizes; proper hierarchy |
| **Spacing System** | 4dp grid alignment; consistent padding/margins |
| **Components** | Buttons, cards, dialogs, FABs, chips, lists follow MD3 specs |
| **Navigation** | Bottom nav (3-5 items), tabs, drawer, top app bar |
| **Motion** | Meaningful transitions; shared element animations; duration 150-300ms |
| **Elevation** | Consistent shadow/tonal elevation; surface hierarchy |
| **Icons** | Material Symbols; 24dp standard; outlined/filled consistency |

### MD3 Principles to Apply

| Principle | Question |
|-----------|----------|
| Adaptive | "Does the UI adapt to screen size and orientation?" |
| Accessible | "Do colors meet contrast requirements?" |
| Personal | "Does the app support dynamic color / themed icons?" |
| Expressive | "Is there a clear visual identity within MD3 constraints?" |

### Deliverable

A compliance matrix showing MD3 adherence per component category.

---

## Stage 3: React Native / Expo Specifics

**Goal:** Identify platform-specific implementation issues.

### Checklist

| Area | What to Check |
|------|---------------|
| **Platform styles** | `Platform.select()` for Android-specific overrides |
| **StatusBar** | `StatusBar` component with `backgroundColor` and `barStyle` |
| **Back handling** | `BackHandler` for Android hardware/gesture back |
| **Keyboard** | `KeyboardAvoidingView` with `behavior="height"` on Android |
| **Touch feedback** | `Pressable` with `android_ripple` vs `TouchableOpacity` |
| **Safe areas** | `SafeAreaView` or `react-native-safe-area-context` |
| **Fonts** | Loaded via `expo-font`; fallback handling |
| **Images** | Proper resolution (`@2x`, `@3x`); `resizeMode` set |
| **Lists** | `FlatList`/`SectionList` for long lists; `keyExtractor` present |
| **Animations** | `react-native-reanimated` for 60fps; `useNativeDriver: true` |

### Questions to Ask

- Is there visual feedback on every tap?
- Does the keyboard push content appropriately?
- Do lists scroll smoothly with 100+ items?
- Are platform-specific styles applied where needed?

### Deliverable

A list of React Native/Expo implementation issues with code-level recommendations.

---

## Stage 4: Android Platform Fit

**Goal:** Ensure the app feels native on Android.

### Native Conventions Checklist

| Area | What to Check |
|------|---------------|
| **Back navigation** | Hardware back button works; gesture nav supported |
| **System bars** | Status bar color/style; navigation bar handling; edge-to-edge |
| **Edge-to-edge** | Content draws behind system bars with proper insets |
| **Large screens** | Tablet layout adaptations; foldable support |
| **Input modes** | Touch, keyboard, stylus considerations |
| **Deep links** | `smartswap://` scheme works; intent handling |
| **Notifications** | Proper channels; heads-up display for urgent |
| **Permissions** | Runtime permission requests; rationale shown |

### Android-Specific Patterns

| Pattern | Implementation |
|---------|----------------|
| Ripple effect | `android_ripple={{ color: 'rgba(0,0,0,0.1)' }}` |
| Status bar | `StatusBar translucent backgroundColor="transparent"` |
| Navigation bar | `navigationBarColor` via `expo-navigation-bar` |
| Splash | `expo-splash-screen` with proper duration |

### Deliverable

A platform fit score (1-10) with specific Android convention violations listed.

---

## Stage 5: Accessibility Review (WCAG)

**Goal:** Ensure inclusive design meeting WCAG 2.1 AA standards.

### WCAG Checklist

| Criterion | Requirement | How to Check |
|-----------|-------------|--------------|
| **Touch targets** | 48dp minimum (44px iOS, 48dp Android) | Measure interactive elements |
| **Color contrast** | 4.5:1 for text, 3:1 for UI components | Use contrast checker tool |
| **Labels** | `accessibilityLabel` on all interactive elements | Screen reader test |
| **Hints** | `accessibilityHint` for non-obvious actions | Screen reader test |
| **Roles** | `accessibilityRole` set correctly | Semantic meaning preserved |
| **Focus order** | Logical tab/swipe order | Navigate with TalkBack |
| **Screen reader** | TalkBack announces all content correctly | Manual test |
| **Text scaling** | UI works at 200% font scale | Settings > Display > Font size |
| **Reduced motion** | Respect `prefers-reduced-motion` | `useReducedMotion()` hook |
| **Error identification** | Errors announced to screen readers | Test form validation |

### Accessibility Testing Steps

1. **Enable TalkBack:** Settings > Accessibility > TalkBack
2. **Navigate by swipe:** Swipe right to move through elements
3. **Check announcements:** Every element should have meaningful label
4. **Test forms:** Errors should be announced
5. **Check focus:** Focus indicator visible; order logical

### WCAG Principles (POUR)

| Principle | Questions |
|-----------|-----------|
| **Perceivable** | Can all users perceive the content? |
| **Operable** | Can all users operate the controls? |
| **Understandable** | Is content and operation understandable? |
| **Robust** | Does it work with assistive technologies? |

### Deliverable

An accessibility compliance matrix with WCAG criterion pass/fail status.

---

## Stage 6: Synthesis & RFC

**Goal:** Compile all findings into a prioritized RFC document.

### RFC Template

```markdown
# RFC: UI/UX Audit - [SCREEN/FLOW NAME]

**Author:** UI/UX Expert
**Date:** [date]
**Status:** Draft

## Executive Summary

[2-3 sentences: Key findings and overall health score]

**Health Score:** [X]/10

| Category | Score | Status |
|----------|-------|--------|
| Usability (Nielsen) | X/10 | [emoji] |
| Material Design 3 | X/10 | [emoji] |
| Platform Fit | X/10 | [emoji] |
| Accessibility | X/10 | [emoji] |

## Audit Scope

- **Screens:** [list screens reviewed]
- **User flows:** [list flows reviewed]
- **Platform:** Android (React Native/Expo)
- **Device tested:** [device/emulator]

## Methodology

Applied:
- Nielsen's 10 Usability Heuristics
- Material Design 3 Guidelines
- WCAG 2.1 AA Accessibility Standards
- React Native/Expo best practices
- Android platform conventions

## Findings

### Critical Issues (Blockers)

| # | Issue | Heuristic/Guideline | Location | Impact |
|---|-------|---------------------|----------|--------|
| C1 | [description] | [source] | [file:line or screen] | [user impact] |

### Major Issues

| # | Issue | Heuristic/Guideline | Location | Impact |
|---|-------|---------------------|----------|--------|
| M1 | [description] | [source] | [file:line or screen] | [user impact] |

### Minor Issues

| # | Issue | Heuristic/Guideline | Location | Impact |
|---|-------|---------------------|----------|--------|
| m1 | [description] | [source] | [file:line or screen] | [user impact] |

### Strengths

- [What the app does well]
- [Good patterns to preserve]

## Recommendations

| Issue | Recommendation | Effort | Priority |
|-------|----------------|--------|----------|
| C1 | [specific fix] | S/M/L | P0 |
| M1 | [specific fix] | S/M/L | P1 |
| m1 | [specific fix] | S/M/L | P2 |

**Effort Key:** S = < 1 day, M = 1-3 days, L = > 3 days

## Implementation Path

### Phase 1: Critical Fixes (P0)
- [ ] [Issue C1 fix]
- [ ] [Issue C2 fix]

### Phase 2: Major Improvements (P1)
- [ ] [Issue M1 fix]
- [ ] [Issue M2 fix]

### Phase 3: Polish (P2)
- [ ] [Issue m1 fix]
- [ ] [Issue m2 fix]

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Task completion rate | [X%] | [Y%] | User testing |
| Error rate | [X%] | [Y%] | Analytics |
| WCAG AA compliance | [X%] | 100% | Automated + manual audit |
| User satisfaction | [X] | [Y] | SUS score survey |

## Appendix

### Heuristic Evaluation Matrix

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. Visibility of system status | [Pass/Minor/Major/Critical] | |
| 2. Match system-real world | [Pass/Minor/Major/Critical] | |
| 3. User control and freedom | [Pass/Minor/Major/Critical] | |
| 4. Consistency and standards | [Pass/Minor/Major/Critical] | |
| 5. Error prevention | [Pass/Minor/Major/Critical] | |
| 6. Recognition over recall | [Pass/Minor/Major/Critical] | |
| 7. Flexibility and efficiency | [Pass/Minor/Major/Critical] | |
| 8. Aesthetic and minimalist | [Pass/Minor/Major/Critical] | |
| 9. Error recovery | [Pass/Minor/Major/Critical] | |
| 10. Help and documentation | [Pass/Minor/Major/Critical] | |

### MD3 Compliance Matrix

| Component | Compliant | Notes |
|-----------|-----------|-------|
| Color system | Yes/No | |
| Typography | Yes/No | |
| Spacing | Yes/No | |
| Buttons | Yes/No | |
| Navigation | Yes/No | |
| Motion | Yes/No | |

### WCAG Compliance Matrix

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.4.3 Contrast (Min) | AA | Pass/Fail | |
| 1.4.11 Non-text Contrast | AA | Pass/Fail | |
| 2.4.7 Focus Visible | AA | Pass/Fail | |
| 2.5.5 Target Size | AAA | Pass/Fail | |
```

---

## Quality Checklist

Before finalizing the audit RFC:

### Nielsen Heuristics
- [ ] All 10 heuristics evaluated with specific observations
- [ ] Each finding mapped to a heuristic
- [ ] Severity ratings applied consistently

### Material Design 3
- [ ] Color system reviewed (roles, dynamic color)
- [ ] Typography scale checked
- [ ] Spacing on 4dp grid verified
- [ ] Component compliance assessed
- [ ] Navigation patterns reviewed

### React Native / Expo
- [ ] Platform-specific code reviewed
- [ ] Touch feedback verified
- [ ] List performance assessed
- [ ] Keyboard handling tested

### Android Platform
- [ ] Back button/gesture tested
- [ ] System bar handling verified
- [ ] Deep links tested
- [ ] Large screen behavior checked

### Accessibility (WCAG)
- [ ] Touch targets measured (48dp min)
- [ ] Color contrast verified (4.5:1 / 3:1)
- [ ] Screen reader tested (TalkBack)
- [ ] Text scaling tested (200%)
- [ ] Focus order verified

### RFC Quality
- [ ] Issues prioritized (Critical/Major/Minor)
- [ ] Recommendations are specific and actionable
- [ ] Effort estimates provided
- [ ] Implementation path is incremental
- [ ] Success metrics are measurable

---

## Workflow Summary

1. **Heuristic Evaluation** - Apply Nielsen's 10 heuristics
2. **Material Design 3 Audit** - Check MD3 compliance
3. **React Native / Expo Specifics** - Review implementation
4. **Android Platform Fit** - Verify native conventions
5. **Accessibility Review** - WCAG 2.1 AA compliance
6. **Synthesis & RFC** - Compile prioritized findings

Each stage produces specific deliverables. The final RFC addresses all perspectives with actionable recommendations.

## Tips

- Start with the user's perspective, not the code
- Test on real devices, not just emulators
- Use TalkBack for 5 minutes minimum per screen
- Check at 200% font scale
- Compare against Material Design 3 component library
- Screenshot issues for the RFC
- Prioritize ruthlessly - not everything needs fixing

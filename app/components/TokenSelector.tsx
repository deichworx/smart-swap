import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { useOwnedTokens } from '../hooks/useOwnedTokens';
import { useTokenList } from '../hooks/useTokenList';
import { formatAmountAsString, parseAmountForDisplay } from '../jupiter/formatAmount';
import { Token } from '../jupiter/tokens';
import { JupiterTokenInfo } from '../storage/types';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';
import { FormattedAmount } from './FormattedAmount';

type Props = {
  selected: Token;
  onSelect: (token: Token) => void;
  excludeMint?: string;
};

function jupiterToToken(info: JupiterTokenInfo): Token {
  if (__DEV__ && !info.address) {
    console.error('[TokenSelector] Token without address:', info);
  }
  return {
    symbol: info.symbol ?? 'UNKNOWN',
    name: info.name ?? 'Unknown Token',
    mint: info.address ?? '',
    decimals: info.decimals ?? 0,
    logoURI: info.logoURI,
  };
}

type SectionData = {
  title: string;
  data: readonly JupiterTokenInfo[];
};

// Memoized token row component for list performance
type TokenRowProps = {
  readonly item: JupiterTokenInfo;
  readonly isSelected: boolean;
  readonly isFavorite: boolean;
  readonly balance: string | null;
  readonly onSelect: (token: JupiterTokenInfo) => void;
  readonly onLongPress: (token: JupiterTokenInfo) => void;
};

const TokenRow = memo(function TokenRow({
  item,
  isSelected,
  isFavorite: isFav,
  balance,
  onSelect,
  onLongPress,
}: TokenRowProps) {
  const isVerified = item.isVerified || item.tags?.includes('verified');
  const hasFreeze = item.freezeAuthority !== null && item.freezeAuthority !== undefined;
  const hasMint = item.mintAuthority !== null && item.mintAuthority !== undefined;

  const handlePress = useCallback(() => onSelect(item), [onSelect, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  const balanceLabel = balance !== null ? `, balance: ${formatAmountAsString(parseAmountForDisplay(balance))}` : '';
  const accessibilityLabel = `${item.symbol}, ${item.name}${isVerified ? ', verified' : ''}${isFav ? ', favorite' : ''}${balanceLabel}${isSelected ? ', currently selected' : ''}`;

  return (
    <Pressable
      style={[styles.tokenRow, isSelected && styles.tokenRowSelected]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Tap to select, long press to favorite"
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
    >
      <View style={styles.tokenIcon}>
        <Text style={styles.tokenIconText}>{item.symbol.charAt(0)}</Text>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.tokenInfo}>
        <View style={styles.tokenNameRow}>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
          {isFav && <Text style={styles.starIcon}>★</Text>}
        </View>
        <View style={styles.tokenMetaRow}>
          <Text style={styles.tokenName} numberOfLines={1}>
            {item.name}
          </Text>
          {(hasFreeze || hasMint) && (
            <View
              style={styles.warningBadge}
              accessibilityLabel={
                hasFreeze && hasMint
                  ? 'Has freeze and mint authority - token issuer can freeze or mint more tokens'
                  : hasFreeze
                  ? 'Has freeze authority - token issuer can freeze your tokens'
                  : 'Has mint authority - token issuer can mint more tokens'
              }
            >
              <Text style={styles.warningText}>
                {hasFreeze && hasMint ? '⚠ Freeze+Mint' : hasFreeze ? '⚠ Freeze' : '⚠ Mint'}
              </Text>
            </View>
          )}
        </View>
      </View>
      {balance !== null ? (
        <FormattedAmount amount={balance} style={styles.balanceText} />
      ) : isSelected ? (
        <Text style={styles.checkmark}>✓</Text>
      ) : null}
    </Pressable>
  );
});

export default function TokenSelector({ selected, onSelect, excludeMint }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInputType>(null);
  const {
    tokens,
    favoriteTokens,
    isLoading,
    searchResults,
    isSearching,
    searchLive,
    clearSearch,
    addFavorite,
    removeFavorite,
    isFavorite,
    addTokenToCache,
    getToken,
  } = useTokenList();
  const { ownedTokens, getBalance, refresh: refreshBalances } = useOwnedTokens();

  // Trigger live search when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchLive(searchQuery);
    } else {
      clearSearch();
    }
  }, [searchQuery, searchLive, clearSearch]);

  // Refresh balances and focus search when modal opens
  useEffect(() => {
    if (modalVisible) {
      refreshBalances();
      // Delay focus slightly to ensure modal animation is complete
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [modalVisible, refreshBalances]);

  const handleSelect = useCallback(
    (token: JupiterTokenInfo) => {
      // Add selected token to cache so it's available for display
      addTokenToCache(token);
      onSelect(jupiterToToken(token));
      setModalVisible(false);
      setSearchQuery('');
      clearSearch();
    },
    [onSelect, addTokenToCache, clearSearch],
  );

  const handleClose = useCallback(() => {
    setModalVisible(false);
    setSearchQuery('');
    clearSearch();
  }, [clearSearch]);

  const handleLongPress = useCallback(
    (token: JupiterTokenInfo) => {
      if (__DEV__) {
        console.log('[TokenSelector] Long press on:', token.symbol, 'address:', token.address);
      }
      if (!token.address) {
        if (__DEV__) {
          console.error('[TokenSelector] Token has no address!', token);
        }
        return;
      }
      // Add to cache before favoriting
      addTokenToCache(token);
      if (isFavorite(token.address)) {
        removeFavorite(token.address);
      } else {
        addFavorite(token.address);
      }
    },
    [isFavorite, addFavorite, removeFavorite, addTokenToCache],
  );

  // Single-pass filter for all token arrays
  const { filteredFavorites, filteredTokens, filteredSearchResults } = useMemo(() => {
    const exclude = (t: JupiterTokenInfo) => t.address !== excludeMint;
    return {
      filteredFavorites: favoriteTokens.filter(exclude),
      filteredTokens: tokens.filter(exclude),
      filteredSearchResults: searchResults.filter(exclude),
    };
  }, [excludeMint, favoriteTokens, tokens, searchResults]);

  // Build owned tokens section from wallet balances
  const ownedTokenInfos = useMemo(() => {
    return ownedTokens
      .filter(t => t.mint !== excludeMint)
      .map(owned => {
        // Try to get token info from cache
        const info = getToken(owned.mint);
        if (info) {
          return info;
        }
        // Fallback for tokens not in cache
        return {
          address: owned.mint,
          symbol: owned.mint.slice(0, 4) + '...',
          name: 'Unknown Token',
          decimals: owned.decimals,
        } as JupiterTokenInfo;
      });
  }, [ownedTokens, excludeMint, getToken]);

  const sections: SectionData[] = useMemo(() => {
    // When searching, show API results
    if (searchQuery.length >= 2) {
      if (filteredSearchResults.length > 0) {
        return [{ title: 'Search Results', data: filteredSearchResults.slice(0, 50) }];
      }
      return [];
    }

    // Default view: Your Tokens + Favorites + Popular
    const result: SectionData[] = [];

    // Your Tokens (owned) - always first
    if (ownedTokenInfos.length > 0) {
      result.push({ title: 'Your Tokens', data: ownedTokenInfos });
    }

    // Favorites (excluding owned tokens to avoid duplicates)
    const favoritesNotOwned = filteredFavorites.filter(
      f => !ownedTokens.some(o => o.mint === f.address),
    );
    if (favoritesNotOwned.length > 0) {
      result.push({ title: 'Favorites', data: favoritesNotOwned });
    }

    // Popular tokens (excluding owned and favorites)
    const otherTokens = filteredTokens.filter(
      t =>
        !ownedTokens.some(o => o.mint === t.address) &&
        !favoriteTokens.some(f => f.address === t.address),
    );
    if (otherTokens.length > 0) {
      result.push({ title: 'Popular Tokens', data: otherTokens.slice(0, 100) });
    }

    return result;
  }, [searchQuery, filteredSearchResults, filteredTokens, filteredFavorites, favoriteTokens, ownedTokenInfos, ownedTokens]);

  const renderItem = useCallback(
    ({ item }: { item: JupiterTokenInfo }) => {
      const isSelected = item.address === selected.mint;
      const isFav = item.address ? isFavorite(item.address) : false;
      const balance = item.address ? getBalance(item.address) : null;

      return (
        <TokenRow
          item={item}
          isSelected={isSelected}
          isFavorite={isFav}
          balance={balance}
          onSelect={handleSelect}
          onLongPress={handleLongPress}
        />
      );
    },
    [selected.mint, isFavorite, handleSelect, handleLongPress, getBalance],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: JupiterTokenInfo, index: number) => item.address || `fallback-${index}`,
    [],
  );

  const showLoading = isLoading || (isSearching && searchQuery.length >= 2);
  const showEmpty = !showLoading && sections.length === 0 && searchQuery.length >= 2;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.selector, pressed && { opacity: 0.7 }]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={`Selected token: ${selected.symbol}. Tap to change.`}
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
      >
        <Text style={styles.symbol}>{selected.symbol}</Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleClose}
          accessibilityLabel="Close token selector"
          accessibilityRole="button"
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Token</Text>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search any token..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search tokens"
                accessibilityHint="Type at least 2 characters to search"
              />
              {isSearching && (
                <View style={styles.searchingIndicator}>
                  <ActivityIndicator size="small" color={colors.accent.purple} />
                </View>
              )}
              {searchQuery.length > 0 && !isSearching && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                  android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.hint}>
              {searchQuery.length < 2
                ? 'Type 2+ chars to search · Long press to favorite'
                : 'Long press to favorite'}
            </Text>

            {showLoading && sections.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.purple} />
              </View>
            ) : showEmpty ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{`No tokens found for "${searchQuery}"`}</Text>
              </View>
            ) : (
              <SectionList
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
                removeClippedSubviews
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  symbol: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  chevron: {
    color: colors.text.tertiary,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.modal,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.secondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  searchContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: 44,
    fontSize: fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  searchingIndicator: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    color: colors.text.tertiary,
    fontSize: fontSize.md,
  },
  hint: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: fontSize.md,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.card,
  },
  tokenRowSelected: {
    borderWidth: 1,
    borderColor: colors.accent.purple,
    backgroundColor: colors.overlay.purpleSubtle,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  tokenIconText: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg.card,
  },
  verifiedIcon: {
    color: colors.bg.primary,
    fontSize: 8,
    fontWeight: fontWeight.bold,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tokenMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  warningBadge: {
    backgroundColor: colors.status.warningBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  warningText: {
    color: colors.status.warning,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  tokenSymbol: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  starIcon: {
    color: colors.status.warning,
    fontSize: fontSize.sm,
  },
  tokenName: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    flexShrink: 1,
  },
  checkmark: {
    color: colors.accent.purple,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  balanceText: {
    color: colors.accent.green,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

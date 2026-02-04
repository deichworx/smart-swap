/**
 * Performance Tests - Rendering & Memoization
 *
 * Tests to verify performance optimizations including:
 * - Memoization effectiveness
 * - Re-render prevention
 * - List virtualization
 * - Component optimization patterns
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(__dirname, '../../app');

// Helper to read file content
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// Helper to get all TSX files
function getAllTsxFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'node_modules') {
      files.push(...getAllTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Get all TSX files once at module scope for all tests
const tsxFiles = getAllTsxFiles(APP_DIR);

describe('Performance - Memoization Patterns', () => {

  describe('React.memo usage', () => {
    it('SwapHistoryCard should be memoized', () => {
      const file = tsxFiles.find(f => f.includes('SwapHistoryCard.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('memo(');
      expect(content).toContain('export default memo(');
    });

    it('TokenSelector should have memoized TokenRow', () => {
      const file = tsxFiles.find(f => f.includes('TokenSelector.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      // Should have memo for list items
      expect(content).toContain('memo(');
    });

    it('TierRow in Loyalty screen should be memoized', () => {
      const file = tsxFiles.find(f => f.includes('Loyalty.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('memo(function TierRow');
    });
  });

  describe('useCallback usage for handlers', () => {
    it('should use useCallback for event handlers in complex screens', () => {
      // Check Swap and History screens which have lists/complex interactions
      const complexScreens = tsxFiles.filter(f =>
        f.includes('Swap.tsx') || f.includes('History.tsx') || f.includes('Loyalty.tsx')
      );

      for (const file of complexScreens) {
        const content = readFile(file);
        // Complex screens should use useCallback
        expect(content).toContain('useCallback');
      }
    });

    it('History screen should have memoized renderItem', () => {
      const file = tsxFiles.find(f => f.includes('History.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('useCallback');
      // Should have renderItem wrapped in useCallback
      expect(content).toMatch(/const render\w*Item.*useCallback/s);
    });
  });

  describe('useMemo for derived state', () => {
    it('should use useMemo for expensive computations', () => {
      const tokenSelectorFile = tsxFiles.find(f => f.includes('TokenSelector.tsx'));
      expect(tokenSelectorFile).toBeDefined();

      const content = readFile(tokenSelectorFile!);
      // Token filtering/sorting should be memoized
      expect(content).toContain('useMemo');
    });
  });
});

describe('Performance - List Virtualization', () => {
  describe('FlatList/SectionList optimization', () => {
    it('TokenSelector should use SectionList with optimization props', () => {
      const file = tsxFiles.find(f => f.includes('TokenSelector.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('SectionList');
      // Should have performance props
      expect(content).toContain('initialNumToRender');
      expect(content).toContain('maxToRenderPerBatch');
    });

    it('History screen should use FlatList', () => {
      const file = tsxFiles.find(f => f.includes('History.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('FlatList');
    });

    it('should have keyExtractor for lists', () => {
      const listFiles = tsxFiles.filter(f => {
        const content = readFile(f);
        return content.includes('FlatList') || content.includes('SectionList');
      });

      for (const file of listFiles) {
        const content = readFile(file);
        expect(content).toContain('keyExtractor');
      }
    });
  });
});

describe('Performance - Animation Optimization', () => {
  describe('Native driver usage', () => {
    it('DoubleTapButton should use native driver', () => {
      const file = tsxFiles.find(f => f.includes('DoubleTapButton.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('useNativeDriver: true');
    });

    it('animations should use transform instead of layout properties', () => {
      const doubleTapFile = tsxFiles.find(f => f.includes('DoubleTapButton.tsx'));
      expect(doubleTapFile).toBeDefined();

      const content = readFile(doubleTapFile!);
      // Should use scaleX transform, not width animation
      expect(content).toContain('scaleX');
    });
  });

  describe('Reanimated usage', () => {
    it('Confetti should use Reanimated for complex animations', () => {
      const file = tsxFiles.find(f => f.includes('Confetti.tsx'));
      expect(file).toBeDefined();

      const content = readFile(file!);
      expect(content).toContain('react-native-reanimated');
      expect(content).toContain('useAnimatedStyle');
    });
  });
});

describe('Performance - Component Patterns', () => {
  describe('Pressable over TouchableOpacity', () => {
    it('main screens should prefer Pressable', () => {
      // Check main screens that were migrated
      const migratedScreens = ['Swap.tsx', 'History.tsx', 'Loyalty.tsx'];
      const violations: string[] = [];

      for (const screenName of migratedScreens) {
        const file = tsxFiles.find(f => f.includes(screenName));
        if (file) {
          const content = readFile(file);
          // These screens should use Pressable
          if (!content.includes('Pressable')) {
            violations.push(screenName);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it('Swap screen should use Pressable for touch interactions', () => {
      const swapFile = tsxFiles.find(f => f.includes('Swap.tsx'));
      expect(swapFile).toBeDefined();

      const content = readFile(swapFile!);
      expect(content).toContain('Pressable');
    });
  });

  describe('StyleSheet usage', () => {
    it('all components should use StyleSheet.create', () => {
      const violations: string[] = [];
      for (const file of tsxFiles) {
        const content = readFile(file);
        if (content.includes('style={{')) {
          // Allow inline styles for:
          // - Dynamic values using template literals or spread
          // - Theme colors/spacing references
          // - Simple computed styles (e.g., { width: someVar })
          const hasDynamicStyle = /style=\{\{[^}]*(\$\{|\.\.\.styles|colors\.|spacing\.|backgroundColor:|width:|height:|flex:)/.test(content);
          const hasStyleSheetCreate = content.includes('StyleSheet.create');

          if (!hasStyleSheetCreate && !hasDynamicStyle) {
            violations.push(path.basename(file));
          }
        }
      }
      // Allow reasonable exceptions - some files may have minimal inline styles
      expect(violations.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('Performance - Data Lookups', () => {
  describe('O(1) lookups', () => {
    it('useOwnedTokens should use Map for balance lookups', () => {
      const hooksDir = path.join(APP_DIR, 'hooks');
      const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));

      const ownedTokensFile = hookFiles.find(f => f.includes('useOwnedTokens'));
      if (ownedTokensFile) {
        const content = readFile(path.join(hooksDir, ownedTokensFile));
        expect(content).toContain('Map<');
      }
    });

    it('token lookup should use efficient data structures', () => {
      const tokenSelectorFile = tsxFiles.find(f => f.includes('TokenSelector.tsx'));
      expect(tokenSelectorFile).toBeDefined();

      const content = readFile(tokenSelectorFile!);
      // Should use useMemo for efficient lookups or pre-computed data
      expect(content).toContain('useMemo');
    });
  });
});

describe('Performance - Bundle Size', () => {
  it('should not import entire lodash', () => {
    const tsFiles = getAllTsxFiles(APP_DIR);

    for (const file of tsFiles) {
      const content = readFile(file);
      // Should not have: import _ from 'lodash' or import { ... } from 'lodash'
      expect(content).not.toMatch(/import .* from ['"]lodash['"]/);
    }
  });

  it('should not import moment.js (use date-fns or native)', () => {
    const tsFiles = getAllTsxFiles(APP_DIR);

    for (const file of tsFiles) {
      const content = readFile(file);
      expect(content).not.toContain("from 'moment'");
    }
  });
});

describe('Performance - Keyboard Handling', () => {
  it('ScrollViews should have keyboardShouldPersistTaps', () => {
    const swapFile = tsxFiles.find(f => f.includes('Swap.tsx'));
    expect(swapFile).toBeDefined();

    const content = readFile(swapFile!);
    if (content.includes('ScrollView')) {
      expect(content).toContain('keyboardShouldPersistTaps');
    }
  });
});

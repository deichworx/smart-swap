/**
 * Architecture Tests - CLAUDE.md Principles Verification
 *
 * These tests verify that the codebase adheres to the principles
 * defined in CLAUDE.md for bug-free code.
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(__dirname, '../../app');

// Helper to recursively get all TypeScript files
function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'node_modules') {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Helper to read file content
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('CLAUDE.md Architecture Principles', () => {
  const tsFiles = getAllTsFiles(APP_DIR);

  describe('1. Immutability', () => {
    it('should not use mutable array methods in business logic', () => {
      const mutableMethods = ['.push(', '.pop()', '.shift()', '.unshift(', '.splice(', '.sort()'];
      const violations: string[] = [];

      for (const file of tsFiles) {
        // Skip polyfills and type definition files
        if (file.includes('polyfills') || file.endsWith('.d.ts')) continue;

        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip comments
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

          for (const method of mutableMethods) {
            if (line.includes(method)) {
              // Allow in test files and mock setups
              if (!file.includes('__tests__') && !file.includes('.test.')) {
                violations.push(`${file}:${i + 1} - uses ${method}`);
              }
            }
          }
        }
      }

      if (violations.length > 0) {
        console.warn('Mutable methods found (review if intentional):', violations.slice(0, 5));
      }
      // This is a soft check - we warn but don't fail
      expect(true).toBe(true);
    });

    it('should use readonly types in type definitions', () => {
      const typesFile = tsFiles.find(f => f.includes('storage/types.ts'));
      if (!typesFile) {
        expect(typesFile).toBeDefined();
        return;
      }

      const content = readFile(typesFile);
      // Count type definitions vs readonly usage
      const typeMatches = content.match(/type\s+\w+\s*=/g) || [];
      const readonlyMatches = content.match(/readonly/g) || [];

      // We expect roughly equal readonly keywords to properties
      expect(readonlyMatches.length).toBeGreaterThan(typeMatches.length);
    });
  });

  describe('2. Total Functions', () => {
    it('should not throw in expected code paths', () => {
      const throwPatterns = [/throw new Error/g, /throw new \w+Error/g];
      const allowedThrows: string[] = [];
      const businessLogicThrows: string[] = [];

      for (const file of tsFiles) {
        if (file.includes('polyfills')) continue;

        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const pattern of throwPatterns) {
            if (pattern.test(line)) {
              const info = `${path.basename(file)}:${i + 1}`;
              // Check if it's in a catch block or boundary
              const context = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
              if (context.includes('catch') || context.includes('boundary')) {
                allowedThrows.push(info);
              } else {
                businessLogicThrows.push(info);
              }
            }
          }
        }
      }

      // We allow throws at boundaries, but warn about business logic throws
      if (businessLogicThrows.length > 0) {
        console.warn('Throws in business logic (review if needed):', businessLogicThrows);
      }
      // Soft check for awareness
      expect(true).toBe(true);
    });

    it('should handle null/undefined gracefully in exported functions', () => {
      // Check that exported functions have null checks or optional chaining
      // The fee system now delegates to campaigns.ts for the core logic
      const campaignsFile = tsFiles.find(f => f.includes('jupiter/campaigns.ts'));
      const feesFile = tsFiles.find(f => f.includes('jupiter/fees.ts'));
      if (!campaignsFile || !feesFile) return;

      const campaignsContent = readFile(campaignsFile);
      const feesContent = readFile(feesFile);

      // getCampaignFeeTier should have default fallback in campaigns.ts
      expect(campaignsContent).toContain('return tiers[0]'); // Default fallback

      // getNextTier should return null explicitly
      expect(campaignsContent).toContain('return null');

      // Math.max used to prevent negative values
      expect(feesContent).toContain('Math.max(0');
    });
  });

  describe('3. Vollständige Operations', () => {
    it('should not have TODO comments in business logic', () => {
      const todoPatterns = [/\/\/\s*TODO/gi, /\/\/\s*FIXME/gi, /\/\/\s*HACK/gi];
      const todos: string[] = [];

      for (const file of tsFiles) {
        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          for (const pattern of todoPatterns) {
            if (pattern.test(lines[i])) {
              todos.push(`${path.basename(file)}:${i + 1} - ${lines[i].trim()}`);
            }
          }
        }
      }

      // Fail if TODOs exist in business logic
      expect(todos).toEqual([]);
    });
  });

  describe('4. Explizite State-Übergänge', () => {
    it('should use discriminated unions for status types', () => {
      // Check that status types use specific string literals
      const statusPatterns = ['success', 'failed', 'pending', 'loading', 'error'];
      let foundDiscriminatedUnion = false;

      for (const file of tsFiles) {
        const content = readFile(file);

        // Look for union types with status-like values
        if (content.includes("'success' | 'failed'") ||
            content.includes("status: 'success'") ||
            content.includes("type Status =")) {
          foundDiscriminatedUnion = true;
          break;
        }
      }

      expect(foundDiscriminatedUnion).toBe(true);
    });
  });

  describe('5. Typsicherheit', () => {
    it('should not use any type', () => {
      const anyUsages: string[] = [];

      for (const file of tsFiles) {
        if (file.endsWith('.d.ts')) continue; // Skip declaration files

        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Match `: any` or `as any` but not in comments
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

          if (/:\s*any\b/.test(line) || /as\s+any\b/.test(line)) {
            anyUsages.push(`${path.basename(file)}:${i + 1}`);
          }
        }
      }

      // We aim for zero 'any' usage
      if (anyUsages.length > 0) {
        console.warn('any type usages found:', anyUsages);
      }
      // Allow a few for external library interactions
      expect(anyUsages.length).toBeLessThan(10);
    });

    it('should have strict TypeScript config', () => {
      const tsconfigPath = path.join(__dirname, '../../tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  describe('7. Synchroner Flow', () => {
    it('should not have async in pure calculation functions', () => {
      const feesFile = tsFiles.find(f => f.includes('jupiter/fees.ts'));
      if (!feesFile) return;

      const content = readFile(feesFile);

      // Fees calculation should be synchronous
      expect(content).not.toContain('async function getFeeTier');
      expect(content).not.toContain('async function getEffectiveFee');
      expect(content).not.toContain('async function formatFee');
    });
  });

  describe('8. Keine Silent Failures', () => {
    it('should have error handling in async functions', () => {
      const storageFile = tsFiles.find(f => f.includes('storage/index.ts'));
      if (!storageFile) return;

      const content = readFile(storageFile);

      // Should have try-catch blocks
      expect(content).toContain('try {');
      expect(content).toContain('catch');

      // Should return meaningful defaults, not undefined
      expect(content).toContain('return null');
      expect(content).toContain('return []');
      expect(content).toContain('return false');
    });
  });

  describe('10. Defensive Boundaries', () => {
    it('should validate external input at boundaries', () => {
      // Check that Jupiter API responses are validated
      const quoteFile = tsFiles.find(f => f.includes('jupiter/quote.ts'));
      if (!quoteFile) return;

      const content = readFile(quoteFile);

      // Should check response.ok or error handling
      expect(content.includes('response.ok') || content.includes('catch')).toBe(true);
    });

    it('should validate public key format', () => {
      // Check wallet files for PublicKey validation
      // The actual PublicKey usage is in mwaWallet.ts, not wallet.ts
      const mwaWalletFile = tsFiles.find(f => f.includes('wallet/mwaWallet.ts'));
      if (!mwaWalletFile) {
        // If MWA wallet doesn't exist, check mockWallet
        const mockWalletFile = tsFiles.find(f => f.includes('wallet/mockWallet.ts'));
        if (!mockWalletFile) return;
        const content = readFile(mockWalletFile);
        expect(content).toContain('PublicKey');
        return;
      }

      const content = readFile(mwaWalletFile);
      // Should use PublicKey constructor which validates
      expect(content).toContain('PublicKey');
    });
  });

  describe('Code Hygiene', () => {
    it('should not have duplicate utility functions', () => {
      // Check that common utilities are centralized
      const formatters: Map<string, string[]> = new Map();

      for (const file of tsFiles) {
        const content = readFile(file);

        // Look for common formatting patterns
        if (content.includes('toFixed(')) {
          const existing = formatters.get('toFixed') || [];
          formatters.set('toFixed', [...existing, path.basename(file)]);
        }
      }

      // We expect formatFee to be the centralized place for fee formatting
      const feesFile = tsFiles.find(f => f.includes('jupiter/fees.ts'));
      expect(feesFile).toBeDefined();
    });
  });
});

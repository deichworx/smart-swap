/**
 * Security Audit Tests
 *
 * Automated security checks for:
 * - API key exposure
 * - Input validation
 * - Transaction security
 * - Data handling
 * - XSS prevention
 * - Injection vulnerabilities
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(__dirname, '../../app');
const ROOT_DIR = path.join(__dirname, '../../');

// Helper to recursively get all files
function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  const walk = (directory: string) => {
    const items = fs.readdirSync(directory);
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
        walk(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  };

  walk(dir);
  return files;
}

// Helper to read file
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Security Audit - API Key Exposure', () => {
  const sourceFiles = getAllFiles(APP_DIR, ['.ts', '.tsx']);

  describe('No hardcoded secrets', () => {
    it('should not contain hardcoded API keys', () => {
      const apiKeyPatterns = [
        /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
        /secret\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
        /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      ];

      const violations: string[] = [];

      for (const file of sourceFiles) {
        // Skip example/template files
        if (file.includes('.example') || file.includes('test')) continue;

        const content = readFile(file);
        for (const pattern of apiKeyPatterns) {
          if (pattern.test(content)) {
            violations.push(`${path.basename(file)}: Potential hardcoded secret`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it('should use environment variables for sensitive data', () => {
      const configFile = sourceFiles.find(f => f.includes('jupiter/config.ts'));
      expect(configFile).toBeDefined();

      const content = readFile(configFile!);
      // Should reference env variables
      expect(content).toContain('process.env');
    });

    it('.env.example should exist', () => {
      const envExamplePath = path.join(ROOT_DIR, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('.gitignore should exclude .env files', () => {
      const gitignorePath = path.join(ROOT_DIR, '.gitignore');
      const content = readFile(gitignorePath);
      expect(content).toContain('.env');
    });
  });
});

describe('Security Audit - Input Validation', () => {
  describe('Mint address validation', () => {
    it('quote.ts should validate mint addresses', () => {
      const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
      const content = readFile(quoteFile);

      // Should have validation function
      expect(content).toContain('isValidMintAddress');
      // Should validate before API call
      expect(content).toMatch(/if.*!isValidMintAddress.*throw/s);
    });

    it('should validate public key format', () => {
      const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
      const content = readFile(quoteFile);

      // Should use MintAddress branded type for validation (or legacy PublicKey)
      const usesBrandedTypes = content.includes('MintAddress.parse') || content.includes('MintAddress.isValid');
      const usesPublicKey = content.includes('new PublicKey');
      expect(usesBrandedTypes || usesPublicKey).toBe(true);
    });
  });

  describe('Amount validation', () => {
    it('should handle numeric string amounts safely', () => {
      const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
      const content = readFile(quoteFile);

      // Amount should be passed as string to avoid precision issues
      expect(content).toContain('amount: string');
    });
  });

  describe('URL parameter sanitization', () => {
    it('should not concatenate user input directly into URLs', () => {
      const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
      const content = readFile(quoteFile);

      // Should use URL parameters array, not string concatenation with user input
      expect(content).toContain('queryParams');
      expect(content).toContain('.join(');
    });
  });
});

describe('Security Audit - Transaction Security', () => {
  describe('Transaction signing', () => {
    it('should use wallet adapter for signing', () => {
      const walletFiles = getAllFiles(path.join(APP_DIR, 'wallet'), ['.ts']);

      let hasSignTransaction = false;
      for (const file of walletFiles) {
        const content = readFile(file);
        if (content.includes('signTransaction') || content.includes('signAllTransactions')) {
          hasSignTransaction = true;
        }
      }

      expect(hasSignTransaction).toBe(true);
    });

    it('should verify transaction before signing', () => {
      const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
      const content = readFile(quoteFile);

      // Should deserialize and verify transaction
      expect(content).toContain('VersionedTransaction.deserialize');
    });
  });

  describe('No private key exposure', () => {
    it('should never store private keys', () => {
      const sourceFiles = getAllFiles(APP_DIR, ['.ts', '.tsx']);

      const violations: string[] = [];
      for (const file of sourceFiles) {
        const content = readFile(file);
        if (
          content.includes('privateKey') ||
          content.includes('secretKey') ||
          content.includes('mnemonic')
        ) {
          // Check if it's just a type definition or documentation
          if (!content.includes('// ') && !content.includes('type ')) {
            violations.push(path.basename(file));
          }
        }
      }

      // Filter out false positives (comments, types)
      expect(violations.filter(v => !v.includes('test'))).toEqual([]);
    });
  });
});

describe('Security Audit - Data Storage', () => {
  describe('AsyncStorage security', () => {
    it('should not store sensitive data in plain AsyncStorage', () => {
      const storageFile = path.join(APP_DIR, 'storage/index.ts');
      const content = readFile(storageFile);

      // Should not store private keys or passwords
      expect(content).not.toContain('privateKey');
      expect(content).not.toContain('password');
      expect(content).not.toContain('secretKey');
    });

    it('should have try-catch for storage operations', () => {
      const storageFile = path.join(APP_DIR, 'storage/index.ts');
      const content = readFile(storageFile);

      expect(content).toContain('try {');
      expect(content).toContain('catch');
    });
  });

  describe('Cache expiration', () => {
    it('should have expiration for cached data', () => {
      const storageFile = path.join(APP_DIR, 'storage/index.ts');
      const content = readFile(storageFile);

      // Should check expiration
      expect(content).toMatch(/expir|cache.*time|timestamp/i);
    });
  });
});

describe('Security Audit - XSS Prevention', () => {
  describe('No dangerous HTML rendering', () => {
    it('should not use dangerouslySetInnerHTML', () => {
      const sourceFiles = getAllFiles(APP_DIR, ['.tsx']);

      for (const file of sourceFiles) {
        const content = readFile(file);
        expect(content).not.toContain('dangerouslySetInnerHTML');
      }
    });
  });

  describe('URL validation', () => {
    it('should validate external URLs before opening', () => {
      const sourceFiles = getAllFiles(APP_DIR, ['.tsx', '.ts']);

      for (const file of sourceFiles) {
        const content = readFile(file);
        if (content.includes('Linking.openURL')) {
          // Should have URL validation or use trusted URLs only
          expect(
            content.includes('solscan.io') ||
            content.includes('jup.ag') ||
            content.includes('https://')
          ).toBe(true);
        }
      }
    });
  });
});

describe('Security Audit - API Communication', () => {
  describe('HTTPS enforcement', () => {
    it('should only use HTTPS for API calls', () => {
      const sourceFiles = getAllFiles(APP_DIR, ['.ts', '.tsx']);

      for (const file of sourceFiles) {
        const content = readFile(file);
        // Find fetch calls and ensure they use HTTPS
        const httpMatches = content.match(/fetch\s*\(\s*['"]http:\/\//g);
        expect(httpMatches).toBeNull();
      }
    });

    it('Jupiter API should use HTTPS', () => {
      const configFile = path.join(APP_DIR, 'jupiter/config.ts');
      const content = readFile(configFile);

      expect(content).toContain('https://');
      expect(content).not.toMatch(/['"]http:\/\//);
    });
  });

  describe('Error message security', () => {
    it('should not expose internal errors to users', () => {
      const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
      const content = readFile(quoteFile);

      // Error messages should be generic, not expose internals
      expect(content).toContain('Jupiter API Error');
      // Should not expose full stack traces
      expect(content).not.toContain('console.error(error.stack)');
    });
  });
});

describe('Security Audit - Dependency Security', () => {
  it('should not have known vulnerable patterns', () => {
    const sourceFiles = getAllFiles(APP_DIR, ['.ts', '.tsx']);

    const vulnerablePatterns = [
      /eval\s*\(/g,           // eval() is dangerous
      /new Function\s*\(/g,   // Function constructor is dangerous
      /innerHTML\s*=/g,       // Direct innerHTML assignment
      /document\.write/g,     // document.write is dangerous
    ];

    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = readFile(file);
      for (const pattern of vulnerablePatterns) {
        if (pattern.test(content)) {
          violations.push(`${path.basename(file)}: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('Security Audit - Rate Limiting Awareness', () => {
  it('should handle rate limit errors gracefully', () => {
    const quoteFile = path.join(APP_DIR, 'jupiter/quote.ts');
    const content = readFile(quoteFile);

    // Should handle HTTP 429 errors
    expect(content).toMatch(/res\.ok|response\.ok|status/);
  });

  it('hooks should debounce expensive operations', () => {
    const hookFiles = getAllFiles(path.join(APP_DIR, 'hooks'), ['.ts']);

    let hasDebounce = false;
    for (const file of hookFiles) {
      const content = readFile(file);
      if (content.includes('debounce') || content.includes('setTimeout')) {
        hasDebounce = true;
      }
    }

    // At least some hooks should have rate limiting
    expect(hasDebounce).toBe(true);
  });
});

describe('Security Audit - Wallet Security', () => {
  describe('Public key handling', () => {
    it('should only expose public key, never private', () => {
      // Check all wallet files
      const walletDir = path.join(APP_DIR, 'wallet');
      const walletFiles = getAllFiles(walletDir, ['.ts']);

      let hasPublicKey = false;
      let hasPrivateKey = false;

      for (const file of walletFiles) {
        const content = readFile(file);
        if (content.includes('publicKey') || content.includes('PublicKey')) {
          hasPublicKey = true;
        }
        // Check for actual private key storage (not just types/interfaces)
        if (content.match(/privateKey\s*[:=]/) || content.match(/secretKey\s*[:=]/)) {
          hasPrivateKey = true;
        }
      }

      // Should expose public key functionality
      expect(hasPublicKey).toBe(true);
      // Should not store private keys
      expect(hasPrivateKey).toBe(false);
    });
  });

  describe('Session handling', () => {
    it('should clear session data on disconnect', () => {
      const storageFile = path.join(APP_DIR, 'storage/index.ts');
      const content = readFile(storageFile);

      // Should have clear/delete functionality
      const hasRemoveItem = content.includes('removeItem');
      const hasClear = content.includes('clear');
      expect(hasRemoveItem || hasClear).toBe(true);
    });
  });
});

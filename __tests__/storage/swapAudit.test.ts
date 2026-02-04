import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearSwapAuditLog,
  detectAnomalies,
  exportAuditLog,
  getAuditStats,
  getSwapAuditLog,
  logSwapAudit,
  SwapAuditEntry,
} from '../../app/storage/swapAudit';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('storage/swapAudit', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('logSwapAudit', () => {
    it('should log a swap audit entry', async () => {
      const result = await logSwapAudit({
        wallet: 'wallet123',
        inputMint: 'mintA',
        outputMint: 'mintB',
        inputAmount: '1.5',
        expectedFeeBps: 30,
        actualFeeBps: 30,
        skrBalance: 50000,
        hasSeekerNft: false,
        txSignature: 'sig123',
      });

      expect(result).toBe(true);

      const log = await getSwapAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].wallet).toBe('wallet123');
      expect(log[0].id).toBeDefined();
      expect(log[0].timestamp).toBeDefined();
    });

    it('should prepend new entries (newest first)', async () => {
      await logSwapAudit({
        wallet: 'wallet1',
        inputMint: 'mint1',
        outputMint: 'mint2',
        inputAmount: '1',
        expectedFeeBps: 30,
        actualFeeBps: 30,
        skrBalance: 0,
        hasSeekerNft: false,
        txSignature: 'sig1',
      });

      await logSwapAudit({
        wallet: 'wallet2',
        inputMint: 'mint1',
        outputMint: 'mint2',
        inputAmount: '2',
        expectedFeeBps: 30,
        actualFeeBps: 30,
        skrBalance: 0,
        hasSeekerNft: false,
        txSignature: 'sig2',
      });

      const log = await getSwapAuditLog();
      expect(log[0].wallet).toBe('wallet2');
      expect(log[1].wallet).toBe('wallet1');
    });

    it('should limit to 200 entries', async () => {
      for (let i = 0; i < 210; i++) {
        await logSwapAudit({
          wallet: `wallet${i}`,
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 30,
          actualFeeBps: 30,
          skrBalance: 0,
          hasSeekerNft: false,
          txSignature: `sig${i}`,
        });
      }

      const log = await getSwapAuditLog();
      expect(log).toHaveLength(200);
    });
  });

  describe('clearSwapAuditLog', () => {
    it('should clear all entries', async () => {
      await logSwapAudit({
        wallet: 'wallet1',
        inputMint: 'mint1',
        outputMint: 'mint2',
        inputAmount: '1',
        expectedFeeBps: 30,
        actualFeeBps: 30,
        skrBalance: 0,
        hasSeekerNft: false,
        txSignature: 'sig1',
      });

      await clearSwapAuditLog();

      const log = await getSwapAuditLog();
      expect(log).toEqual([]);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect fee mismatch (actualFeeBps < expectedFeeBps)', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 30,
          actualFeeBps: 10, // Lower than expected
          skrBalance: 50000,
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('fee_mismatch');
      expect(anomalies[0].severity).toBe('medium');
    });

    it('should detect zero fee mismatch as high severity', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 30,
          actualFeeBps: 0, // Zero when should be 30
          skrBalance: 50000,
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies[0].severity).toBe('high');
    });

    it('should detect zero fee with low SKR balance', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 0, // Expected is also 0 (no mismatch)
          actualFeeBps: 0,
          skrBalance: 1000, // Low balance - shouldn't be 0 fee
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies.some(a => a.type === 'zero_fee_low_balance')).toBe(true);
    });

    it('should NOT flag zero fee with high SKR balance', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 0,
          actualFeeBps: 0,
          skrBalance: 200000, // High balance - 0 fee is legitimate
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies).toHaveLength(0);
    });

    it('should NOT flag zero fee with Seeker NFT', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 0,
          actualFeeBps: 0,
          skrBalance: 1000, // Low balance but has NFT
          hasSeekerNft: true,
          txSignature: 'sig1',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies.some(a => a.type === 'zero_fee_low_balance')).toBe(false);
    });

    it('should detect repeated zero fee for same wallet', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 0,
          actualFeeBps: 0,
          skrBalance: 1000,
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
        {
          id: 'entry2',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '2',
          expectedFeeBps: 0,
          actualFeeBps: 0,
          skrBalance: 1000,
          hasSeekerNft: false,
          txSignature: 'sig2',
        },
        {
          id: 'entry3',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '3',
          expectedFeeBps: 0,
          actualFeeBps: 0,
          skrBalance: 1000,
          hasSeekerNft: false,
          txSignature: 'sig3',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies.some(a => a.type === 'repeated_zero_fee')).toBe(true);
    });

    it('should return empty array for legitimate entries', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 30,
          actualFeeBps: 30, // Matches expected
          skrBalance: 50000,
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
      ];

      const anomalies = detectAnomalies(entries);
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('getAuditStats', () => {
    it('should return zeros for empty entries', () => {
      const stats = getAuditStats([]);
      expect(stats).toEqual({
        totalSwaps: 0,
        anomalyCount: 0,
        averageFeeBps: 0,
        zeroFeeCount: 0,
      });
    });

    it('should calculate correct stats', () => {
      const entries: SwapAuditEntry[] = [
        {
          id: 'entry1',
          timestamp: Date.now(),
          wallet: 'wallet1',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '1',
          expectedFeeBps: 30,
          actualFeeBps: 30,
          skrBalance: 50000,
          hasSeekerNft: false,
          txSignature: 'sig1',
        },
        {
          id: 'entry2',
          timestamp: Date.now(),
          wallet: 'wallet2',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '2',
          expectedFeeBps: 0,
          actualFeeBps: 0,
          skrBalance: 150000,
          hasSeekerNft: false,
          txSignature: 'sig2',
        },
        {
          id: 'entry3',
          timestamp: Date.now(),
          wallet: 'wallet3',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '3',
          expectedFeeBps: 20,
          actualFeeBps: 20,
          skrBalance: 80000,
          hasSeekerNft: false,
          txSignature: 'sig3',
        },
      ];

      const stats = getAuditStats(entries);
      expect(stats.totalSwaps).toBe(3);
      expect(stats.zeroFeeCount).toBe(1);
      expect(stats.averageFeeBps).toBe(17); // (30 + 0 + 20) / 3 = 16.67 rounded
    });
  });

  describe('exportAuditLog', () => {
    it('should export as valid JSON', async () => {
      await logSwapAudit({
        wallet: 'wallet1',
        inputMint: 'mint1',
        outputMint: 'mint2',
        inputAmount: '1',
        expectedFeeBps: 30,
        actualFeeBps: 30,
        skrBalance: 50000,
        hasSeekerNft: false,
        txSignature: 'sig1',
      });

      const json = await exportAuditLog();
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.stats).toBeDefined();
      expect(parsed.anomalies).toBeDefined();
      expect(parsed.entries).toHaveLength(1);
    });
  });

  describe('CLAUDE.md Principles', () => {
    describe('Defensive Boundaries', () => {
      it('should handle corrupted JSON gracefully', async () => {
        await AsyncStorage.setItem('@swap_audit', 'invalid-json');
        const log = await getSwapAuditLog();
        expect(log).toEqual([]);
      });
    });

    describe('Total Functions', () => {
      it('getSwapAuditLog returns empty array for null storage', async () => {
        const log = await getSwapAuditLog();
        expect(log).toEqual([]);
      });

      it('detectAnomalies returns empty array for empty input', () => {
        const anomalies = detectAnomalies([]);
        expect(anomalies).toEqual([]);
      });

      it('getAuditStats returns zeros for empty input', () => {
        const stats = getAuditStats([]);
        expect(stats.totalSwaps).toBe(0);
        expect(stats.anomalyCount).toBe(0);
      });
    });

    describe('Immutability', () => {
      it('detectAnomalies does not mutate input', () => {
        const entries: SwapAuditEntry[] = [
          {
            id: 'entry1',
            timestamp: Date.now(),
            wallet: 'wallet1',
            inputMint: 'mint1',
            outputMint: 'mint2',
            inputAmount: '1',
            expectedFeeBps: 30,
            actualFeeBps: 10,
            skrBalance: 50000,
            hasSeekerNft: false,
            txSignature: 'sig1',
          },
        ];

        const entriesCopy = JSON.stringify(entries);
        detectAnomalies(entries);

        expect(JSON.stringify(entries)).toBe(entriesCopy);
      });
    });
  });
});

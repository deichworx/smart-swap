import AsyncStorage from '@react-native-async-storage/async-storage';

const SWAP_AUDIT_KEY = '@swap_audit';
const MAX_AUDIT_ENTRIES = 200;

export type SwapAuditEntry = {
  readonly id: string;
  readonly timestamp: number;
  readonly wallet: string;
  readonly inputMint: string;
  readonly outputMint: string;
  readonly inputAmount: string;
  readonly expectedFeeBps: number;
  readonly actualFeeBps: number;
  readonly skrBalance: number;
  readonly hasSeekerNft: boolean;
  readonly txSignature: string | null;
};

export type AuditAnomaly = {
  readonly entryId: string;
  readonly type: 'fee_mismatch' | 'zero_fee_low_balance' | 'repeated_zero_fee';
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
};

async function getAuditLog(): Promise<readonly SwapAuditEntry[]> {
  try {
    const value = await AsyncStorage.getItem(SWAP_AUDIT_KEY);
    if (value === null) return [];
    return JSON.parse(value) as readonly SwapAuditEntry[];
  } catch {
    return [];
  }
}

async function setAuditLog(entries: readonly SwapAuditEntry[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SWAP_AUDIT_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export async function logSwapAudit(entry: Omit<SwapAuditEntry, 'id' | 'timestamp'>): Promise<boolean> {
  const existing = await getAuditLog();
  const newEntry: SwapAuditEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };
  const updated = [newEntry, ...existing].slice(0, MAX_AUDIT_ENTRIES);
  return setAuditLog(updated);
}

export async function getSwapAuditLog(): Promise<readonly SwapAuditEntry[]> {
  return getAuditLog();
}

export async function clearSwapAuditLog(): Promise<boolean> {
  return setAuditLog([]);
}

/**
 * Detect anomalies in swap audit entries.
 * Anomalies indicate potential fee manipulation attempts.
 */
export function detectAnomalies(entries: readonly SwapAuditEntry[]): readonly AuditAnomaly[] {
  // Group entries by wallet for repeated pattern detection (local mutation OK in pure function)
  const entriesByWallet = new Map<string, SwapAuditEntry[]>();
  for (const entry of entries) {
    const existing = entriesByWallet.get(entry.wallet) ?? [];
    entriesByWallet.set(entry.wallet, [...existing, entry]);
  }

  const anomalies: AuditAnomaly[] = [];

  for (const entry of entries) {
    // Check 1: actualFeeBps < expectedFeeBps (direct manipulation)
    if (entry.actualFeeBps < entry.expectedFeeBps) {
      anomalies.push({
        entryId: entry.id,
        type: 'fee_mismatch',
        description: `Fee mismatch: expected ${entry.expectedFeeBps}bps, actual ${entry.actualFeeBps}bps`,
        severity: entry.actualFeeBps === 0 ? 'high' : 'medium',
      });
    }

    // Check 2: 0 fee with low SKR balance (no NFT bonus)
    if (entry.actualFeeBps === 0 && entry.skrBalance < 100000 && !entry.hasSeekerNft) {
      anomalies.push({
        entryId: entry.id,
        type: 'zero_fee_low_balance',
        description: `Zero fee with only ${entry.skrBalance.toLocaleString()} SKR and no NFT`,
        severity: 'high',
      });
    }
  }

  // Check 3: Repeated zero fee for same wallet with low balance
  for (const [walletAddr, walletEntries] of entriesByWallet) {
    const zeroFeeEntries = walletEntries.filter(
      e => e.actualFeeBps === 0 && e.skrBalance < 100000 && !e.hasSeekerNft,
    );
    if (zeroFeeEntries.length >= 3) {
      anomalies.push({
        entryId: zeroFeeEntries[0].id,
        type: 'repeated_zero_fee',
        description: `Wallet ${walletAddr.slice(0, 8)}... has ${zeroFeeEntries.length} zero-fee swaps with low SKR balance`,
        severity: 'high',
      });
    }
  }

  return anomalies;
}

/**
 * Get summary statistics from audit log.
 */
export function getAuditStats(entries: readonly SwapAuditEntry[]): {
  readonly totalSwaps: number;
  readonly anomalyCount: number;
  readonly averageFeeBps: number;
  readonly zeroFeeCount: number;
} {
  if (entries.length === 0) {
    return {
      totalSwaps: 0,
      anomalyCount: 0,
      averageFeeBps: 0,
      zeroFeeCount: 0,
    };
  }

  const anomalies = detectAnomalies(entries);
  const totalFees = entries.reduce((sum, e) => sum + e.actualFeeBps, 0);
  const zeroFeeCount = entries.filter(e => e.actualFeeBps === 0).length;

  return {
    totalSwaps: entries.length,
    anomalyCount: anomalies.length,
    averageFeeBps: Math.round(totalFees / entries.length),
    zeroFeeCount,
  };
}

/**
 * Export audit log as JSON string for debugging/analysis.
 */
export async function exportAuditLog(): Promise<string> {
  const entries = await getAuditLog();
  const anomalies = detectAnomalies(entries);
  const stats = getAuditStats(entries);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      stats,
      anomalies,
      entries,
    },
    null,
    2,
  );
}

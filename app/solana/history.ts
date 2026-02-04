import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { connection } from './config';

// Jupiter v6 Program ID
const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

export type OnChainSwap = {
  signature: string;
  timestamp: number;
  status: 'success' | 'failed';
  // Token details parsed from transaction
  inputMint?: string;
  outputMint?: string;
  inputAmount?: string;
  outputAmount?: string;
};

export async function getSwapHistory(
  walletAddress: string,
  limit = 20
): Promise<readonly OnChainSwap[]> {
  if (!walletAddress) return [];

  try {
    const wallet = new PublicKey(walletAddress);

    // Get recent transaction signatures
    const signatures = await connection.getSignaturesForAddress(wallet, {
      limit: 50, // Fetch more to filter Jupiter txs
    });

    const swaps: OnChainSwap[] = [];

    for (const sig of signatures) {
      // Basic info without full parsing (faster)
      const isSuccess = sig.err === null;

      // Check if it's a Jupiter transaction by fetching details
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx && isJupiterSwap(tx)) {
          swaps.push({
            signature: sig.signature,
            timestamp: (sig.blockTime ?? 0) * 1000,
            status: isSuccess ? 'success' : 'failed',
            ...parseSwapDetails(tx),
          });

          if (swaps.length >= limit) break;
        }
      } catch {
        // Skip transactions we can't parse
        continue;
      }
    }

    return swaps;
  } catch (error) {
    if (__DEV__) {
      console.error('[History] Error fetching on-chain history:', error);
    }
    return [];
  }
}

function isJupiterSwap(tx: ParsedTransactionWithMeta): boolean {
  const programIds = tx.transaction.message.accountKeys.map(k =>
    typeof k === 'string' ? k : k.pubkey.toString()
  );
  return programIds.includes(JUPITER_PROGRAM_ID);
}

function parseSwapDetails(tx: ParsedTransactionWithMeta): Partial<OnChainSwap> {
  // Parse pre/post token balances to determine swap amounts
  const preBalances = tx.meta?.preTokenBalances ?? [];
  const postBalances = tx.meta?.postTokenBalances ?? [];

  let inputMint: string | undefined;
  let outputMint: string | undefined;
  let inputAmount: string | undefined;
  let outputAmount: string | undefined;

  // Find tokens that decreased (input) and increased (output)
  for (const post of postBalances) {
    const pre = preBalances.find(
      p => p.accountIndex === post.accountIndex && p.mint === post.mint
    );

    if (pre && post.uiTokenAmount.uiAmount !== null && pre.uiTokenAmount.uiAmount !== null) {
      const diff = post.uiTokenAmount.uiAmount - pre.uiTokenAmount.uiAmount;

      if (diff < 0 && !inputMint) {
        inputMint = post.mint;
        inputAmount = Math.abs(diff).toString();
      } else if (diff > 0 && !outputMint) {
        outputMint = post.mint;
        outputAmount = diff.toString();
      }
    }
  }

  return { inputMint, outputMint, inputAmount, outputAmount };
}

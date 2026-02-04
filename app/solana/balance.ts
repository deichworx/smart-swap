import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { withRpcFailover } from './config';

// Simple cache to avoid rate limits
const balanceCache = new Map<string, { balance: string; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Native SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// SPL Token Program
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

type TokenAccountInfo = {
  mint: string;
  amount: string;
  decimals: number;
};

export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<string> {
  if (!walletAddress || !mintAddress) {
    return '0';
  }

  const cacheKey = `${walletAddress}:${mintAddress}`;
  const cached = balanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.balance;
  }

  try {
    const walletPubkey = new PublicKey(walletAddress);
    let balance: string;

    // SOL balance
    if (mintAddress === SOL_MINT) {
      const lamports = await withRpcFailover(conn => conn.getBalance(walletPubkey));
      balance = (lamports / LAMPORTS_PER_SOL).toString();
    } else {
      // SPL Token balance
      const mint = new PublicKey(mintAddress);
      const tokenAccounts = await withRpcFailover(conn =>
        conn.getParsedTokenAccountsByOwner(walletPubkey, { mint })
      );

      if (tokenAccounts.value.length === 0) {
        balance = '0';
      } else {
        const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
        balance = accountInfo.tokenAmount.uiAmountString ?? '0';
      }
    }

    balanceCache.set(cacheKey, { balance, timestamp: Date.now() });
    return balance;
  } catch (error) {
    if (__DEV__) {
      console.error('[Balance] Error fetching balance:', error);
    }
    return '0';
  }
}

export async function getAllTokenBalances(
  walletAddress: string
): Promise<readonly TokenAccountInfo[]> {
  try {
    const walletPubkey = new PublicKey(walletAddress);

    // Get SOL balance and SPL token accounts in parallel (with failover)
    const [solBalance, tokenAccounts] = await Promise.all([
      withRpcFailover(conn => conn.getBalance(walletPubkey)),
      withRpcFailover(conn =>
        conn.getParsedTokenAccountsByOwner(walletPubkey, { programId: TOKEN_PROGRAM_ID })
      ),
    ]);

    const balances: TokenAccountInfo[] = [
      {
        mint: SOL_MINT,
        amount: (solBalance / LAMPORTS_PER_SOL).toString(),
        decimals: 9,
      },
    ];

    for (const account of tokenAccounts.value) {
      const info = account.account.data.parsed.info;
      const amount = info.tokenAmount.uiAmountString;
      if (amount && parseFloat(amount) > 0) {
        balances.push({
          mint: info.mint,
          amount,
          decimals: info.tokenAmount.decimals,
        });
      }
    }

    return balances;
  } catch (error) {
    if (__DEV__) {
      console.error('[Balance] Error fetching all balances:', error);
    }
    return [];
  }
}

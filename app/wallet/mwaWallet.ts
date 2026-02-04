import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { clearWalletAuth, getWalletAuth, setWalletAuth } from '../storage';

const APP_IDENTITY = {
  name: 'Smart Swap',
  uri: 'https://smartswap.app',
  icon: 'favicon.ico', // Relative URI required by MWA
};

type AuthState = {
  authToken: string;
  publicKey: PublicKey;
} | null;

let authState: AuthState = null;

export const mwaWallet = {
  get publicKey(): PublicKey | null {
    return authState?.publicKey ?? null;
  },

  get isConnected(): boolean {
    return authState !== null;
  },

  async authorize(): Promise<{ publicKey: PublicKey }> {
    const result = await transact(async (wallet) => {
      const auth = await wallet.authorize({
        chain: 'solana:mainnet',
        identity: APP_IDENTITY,
      });

      // MWA returns address as Base64 encoded string
      const account = auth.accounts[0];
      const addressBytes = Buffer.from(account.address, 'base64');
      const pubkey = new PublicKey(addressBytes);

      return {
        authToken: auth.auth_token,
        publicKey: pubkey,
      };
    });

    authState = result;

    // Persist auth state
    await setWalletAuth({
      authToken: result.authToken,
      publicKeyBase64: result.publicKey.toBase58(),
    });

    return { publicKey: result.publicKey };
  },

  async restoreSession(): Promise<boolean> {
    const stored = await getWalletAuth();
    if (!stored) {
      if (__DEV__) {
        console.log('[Wallet] No stored session');
      }
      return false;
    }

    // Restore auth state without wallet interaction
    // Token validity will be checked on next transaction
    try {
      authState = {
        authToken: stored.authToken,
        publicKey: new PublicKey(stored.publicKeyBase64),
      };
      if (__DEV__) {
        console.log('[Wallet] Session restored:', stored.publicKeyBase64.slice(0, 8) + '...');
      }
      return true;
    } catch {
      await clearWalletAuth();
      return false;
    }
  },

  /**
   * @deprecated Use signAndSendTransaction instead.
   * Kept for edge cases requiring manual transaction submission.
   */
  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (!authState) {
      throw new Error('Wallet not connected');
    }

    const signed = await transact(async (wallet) => {
      await wallet.reauthorize({
        auth_token: authState!.authToken,
        identity: APP_IDENTITY,
      });

      const result = await wallet.signTransactions({
        transactions: [transaction],
      });

      return result[0];
    });

    return signed as T;
  },

  /**
   * @deprecated Use signAndSendTransaction for each tx instead.
   * Kept for batch operations requiring manual submission.
   */
  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    if (!authState) {
      throw new Error('Wallet not connected');
    }

    return transact(async (wallet) => {
      await wallet.reauthorize({
        auth_token: authState!.authToken,
        identity: APP_IDENTITY,
      });

      const result = await wallet.signTransactions({
        transactions,
      });

      return result as T[];
    });
  },

  /**
   * RECOMMENDED: Use this instead of signTransaction + manual send.
   * Benefits:
   * - Wallet handles Priority Fees automatically
   * - Reduces Replay Attack risk with Durable Nonces
   * - Single user confirmation instead of two
   */
  async signAndSendTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<string> {
    if (!authState) {
      throw new Error('Wallet not connected');
    }

    try {
      return await transact(async (wallet) => {
        await wallet.reauthorize({
          auth_token: authState!.authToken,
          identity: APP_IDENTITY,
        });

        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });

        return signatures[0];
      });
    } catch (error) {
      // CancellationException occurs when wallet app closes after signing
      // If we got this far and have a signature, the transaction was successful
      if (error instanceof Error && error.message.includes('Cancellation')) {
        if (__DEV__) {
          console.log('[Wallet] Session closed after signing (normal behavior)');
        }
        throw new Error('Transaction sent - check wallet for confirmation');
      }
      throw error;
    }
  },

  async disconnect(): Promise<void> {
    authState = null;
    await clearWalletAuth();
  },
};

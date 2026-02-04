import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export class MockWallet {
  publicKey: PublicKey | null = null;

  get isConnected(): boolean {
    return this.publicKey !== null;
  }

  async authorize(): Promise<{ publicKey: PublicKey }> {
    this.publicKey = new PublicKey(
      '7YVd9Y8jN3KXxvFZp1xwP7xkKkF4FJqY9Y9Y9Y9Y9Y9Y'
    );
    return { publicKey: this.publicKey };
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    console.warn('[MockWallet] signTransaction called - returning unsigned');
    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    console.warn('[MockWallet] signAllTransactions called - returning unsigned');
    return transactions;
  }

  async signAndSendTransaction(
    _transaction: Transaction | VersionedTransaction
  ): Promise<string> {
    console.warn('[MockWallet] signAndSendTransaction called - returning mock signature');
    // Return a mock transaction signature
    return 'mock_signature_' + Date.now().toString(36);
  }

  async restoreSession(): Promise<boolean> {
    // Mock wallet doesn't persist sessions
    return false;
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
  }
}

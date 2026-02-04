import { VersionedTransaction } from '@solana/web3.js';

const ULTRA_API = 'https://api.jup.ag/ultra/v1';

// Optional: API Key für höhere Rate Limits
// Holen von: https://portal.jup.ag/
const API_KEY = '';

export type OrderResponse = {
  requestId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapType: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }[];
  transaction: string; // Base64 encoded unsigned transaction
};

export type ExecuteResponse = {
  status: 'Success' | 'Failed';
  signature?: string;
  error?: string;
  code?: string;
};

export type SwapParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  taker: string;
  referralAccount?: string;
  referralFee?: number; // in bps
};

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (API_KEY) {
    h['x-api-key'] = API_KEY;
  }
  return h;
}

export async function getOrder(params: SwapParams): Promise<OrderResponse> {
  const url = new URL(`${ULTRA_API}/order`);
  url.searchParams.set('inputMint', params.inputMint);
  url.searchParams.set('outputMint', params.outputMint);
  url.searchParams.set('amount', params.amount);
  url.searchParams.set('taker', params.taker);

  if (params.referralAccount) {
    url.searchParams.set('referralAccount', params.referralAccount);
  }
  if (params.referralFee) {
    url.searchParams.set('referralFee', String(params.referralFee));
  }

  const res = await fetch(url.toString(), { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Order failed: ${res.status} - ${text}`);
  }

  const data = await res.json();

  if (!data.transaction) {
    throw new Error('No transaction in response - check taker address');
  }

  return data;
}

export async function executeOrder(
  signedTransaction: string,
  requestId: string
): Promise<ExecuteResponse> {
  const res = await fetch(`${ULTRA_API}/execute`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signedTransaction,
      requestId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Execute failed: ${res.status} - ${text}`);
  }

  return res.json();
}

export function deserializeTransaction(base64Tx: string): VersionedTransaction {
  const txBuffer = Buffer.from(base64Tx, 'base64');
  return VersionedTransaction.deserialize(txBuffer);
}

export function serializeSignedTransaction(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64');
}

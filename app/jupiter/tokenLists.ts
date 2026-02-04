import { getTokenCache, setTokenCache } from '../storage';
import { JupiterTokenInfo } from '../storage/types';
import { getJupiterHeaders, JUPITER_API_BASE } from './config';
import { TOKENS } from './tokens';

type JupiterTokenResponse = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

// v2 Search API uses different field names
type JupiterSearchResult = {
  id: string; // mint address (not "address")
  symbol: string;
  name: string;
  decimals: number;
  icon?: string; // not "logoURI"
  isVerified?: boolean;
  tags?: string[];
  mintAuthority?: string | null;
  audit?: {
    freezeAuthorityDisabled?: boolean;
  };
};

function mapTokenListResponse(token: JupiterTokenResponse): JupiterTokenInfo {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
  };
}

function mapSearchResult(token: JupiterSearchResult): JupiterTokenInfo {
  return {
    address: token.id, // v2 uses "id" for mint address
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.icon, // v2 uses "icon" instead of "logoURI"
    isVerified: token.isVerified,
    tags: token.tags,
    freezeAuthority: token.audit?.freezeAuthorityDisabled === false ? 'enabled' : null,
    mintAuthority: token.mintAuthority,
  };
}

const fallbackTokens: readonly JupiterTokenInfo[] = TOKENS.map(t => ({
  address: t.mint,
  symbol: t.symbol,
  name: t.name,
  decimals: t.decimals,
  logoURI: t.logoURI,
}));

export async function fetchTokenList(): Promise<readonly JupiterTokenInfo[]> {
  const cached = await getTokenCache();
  if (cached) {
    return cached.tokens;
  }

  try {
    const response = await fetch(`${JUPITER_API_BASE}/tokens/v1/strict`, {
      headers: getJupiterHeaders(),
    });
    if (!response.ok) {
      return fallbackTokens;
    }

    const data: JupiterTokenResponse[] = await response.json();
    const tokens = data.map(mapTokenListResponse);

    await setTokenCache({
      tokens,
      updatedAt: Date.now(),
    });

    return tokens;
  } catch {
    return fallbackTokens;
  }
}

export async function searchTokensLive(query: string): Promise<readonly JupiterTokenInfo[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    const url = `${JUPITER_API_BASE}/tokens/v2/search?query=${encodeURIComponent(query.trim())}`;

    const response = await fetch(url, {
      headers: getJupiterHeaders(),
    });
    if (!response.ok) {
      return [];
    }

    const data: JupiterSearchResult[] = await response.json();
    return data.map(mapSearchResult);
  } catch {
    return [];
  }
}

export function searchTokensLocal(
  tokens: readonly JupiterTokenInfo[],
  query: string,
): readonly JupiterTokenInfo[] {
  if (!query.trim()) return tokens;

  const normalizedQuery = query.toLowerCase().trim();

  return tokens.filter(
    t =>
      t.symbol.toLowerCase().includes(normalizedQuery) ||
      t.name.toLowerCase().includes(normalizedQuery) ||
      t.address.toLowerCase() === normalizedQuery,
  );
}

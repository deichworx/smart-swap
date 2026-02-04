# Helius RPC Proxy Setup (Deno Deploy)

Ein einfacher Proxy, der den Helius API-Key serverseitig hält, damit er nicht in der App exponiert wird.

## Warum ein Proxy?

- API-Keys in Mobile Apps können extrahiert werden (APK decompile, etc.)
- Mit Proxy: Key bleibt auf dem Server, App kennt nur die Proxy-URL
- Bonus: Rate Limiting und Logging möglich

## Architektur

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Smart Swap │────▶│  Deno Deploy    │────▶│   Helius    │
│     App     │     │  (Proxy + Key)  │     │     RPC     │
└─────────────┘     └─────────────────┘     └─────────────┘
```

---

## Schritt 1: GitHub Repository erstellen

Erstelle ein neues GitHub Repo (z.B. `helius-proxy`) mit folgenden Dateien:

### `main.ts`

```typescript
const ALLOWED_METHODS = ['eth_call', 'eth_getBalance', 'getAccountInfo', 'getBalance',
  'getLatestBlockhash', 'getTokenAccountsByOwner', 'sendTransaction', 'simulateTransaction'];

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Environment Variables prüfen
  const rpcUrl = Deno.env.get('HELIUS_RPC_URL');
  if (!rpcUrl) {
    console.error('HELIUS_RPC_URL not configured');
    return jsonResponse({ error: 'Proxy misconfigured' }, 500);
  }

  try {
    const body = await req.json();

    // Optional: Methoden-Whitelist prüfen
    if (body.method && !ALLOWED_METHODS.includes(body.method)) {
      return jsonResponse({ error: `Method '${body.method}' not allowed` }, 403);
    }

    // Request an Helius weiterleiten
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return jsonResponse(data, response.status);

  } catch (error) {
    console.error('Proxy error:', error);
    return jsonResponse({ error: 'Proxy error' }, 500);
  }
});

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
```

### `deno.json` (optional, aber empfohlen)

```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-env main.ts"
  }
}
```

---

## Schritt 2: Deno Deploy einrichten

1. **Gehe zu** [dash.deno.com](https://dash.deno.com)

2. **Sign in** mit GitHub

3. **New Project** klicken

4. **Repository verbinden:**
   - "Select a repository" → dein `helius-proxy` Repo wählen
   - Entry point: `main.ts`
   - "Link" klicken

5. **Environment Variables setzen:**
   - Im Project Dashboard → "Settings" → "Environment Variables"
   - Hinzufügen:
     ```
     Name:  HELIUS_RPC_URL
     Value: https://mainnet.helius-rpc.com/?api-key=DEIN_API_KEY
     ```
   - "Add" klicken

6. **Deployment prüfen:**
   - Du bekommst eine URL wie: `https://helius-proxy-abc123.deno.dev`
   - Test mit curl:
     ```bash
     curl -X POST https://helius-proxy-abc123.deno.dev \
       -H "Content-Type: application/json" \
       -d '{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}'
     ```

---

## Schritt 3: Custom Domain (optional)

1. Im Deno Deploy Dashboard → "Settings" → "Domains"
2. "Add Domain" → z.B. `rpc.smartswap.app`
3. DNS-Eintrag beim Domain-Provider setzen:
   ```
   Type:  CNAME
   Name:  rpc
   Value: helius-proxy-abc123.deno.dev
   ```
4. SSL-Zertifikat wird automatisch erstellt

---

## Schritt 4: App konfigurieren

### `.env` / `.env.example`

```bash
# Lokale Entwicklung (direkt zu Helius, Key ist OK für Dev)
EXPO_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=xxx

# Produktion (über Proxy)
# EXPO_PUBLIC_RPC_URL=https://helius-proxy-abc123.deno.dev
```

### `app/solana/connection.ts`

```typescript
import { Connection } from '@solana/web3.js';

const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL;

if (!RPC_URL) {
  throw new Error('EXPO_PUBLIC_RPC_URL not set');
}

export const connection = new Connection(RPC_URL, 'confirmed');
```

---

## Schritt 5: Für Produktion

Beim EAS Build für Production:

```bash
# eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_RPC_URL": "https://helius-proxy-abc123.deno.dev"
      }
    }
  }
}
```

Oder in `eas secret`:
```bash
eas secret:create --name EXPO_PUBLIC_RPC_URL --value "https://helius-proxy-abc123.deno.dev" --scope project
```

---

## Sicherheits-Erweiterungen (optional)

### Rate Limiting hinzufügen

```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // Requests pro Minute
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// In Deno.serve handler:
const ip = req.headers.get('x-forwarded-for') || 'unknown';
if (!checkRateLimit(ip)) {
  return jsonResponse({ error: 'Rate limit exceeded' }, 429);
}
```

### App-Signatur prüfen (optional)

```typescript
const APP_SECRET = Deno.env.get('APP_SECRET');

// In handler:
const signature = req.headers.get('X-App-Signature');
if (APP_SECRET && signature !== APP_SECRET) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}
```

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `HELIUS_RPC_URL not configured` | Environment Variable in Deno Deploy setzen |
| CORS Fehler | Prüfen ob `corsHeaders()` in Response ist |
| 403 Method not allowed | RPC-Methode zur `ALLOWED_METHODS` Liste hinzufügen |
| Timeout | Helius Free Tier hat Limits, ggf. upgraden |

---

## Kosten

- **Deno Deploy Free:** 100k Requests/Tag, 100 GB Bandbreite/Monat
- **Helius Free:** 100k Credits/Tag (ca. 10k-50k RPC Calls je nach Methode)

Für eine Mobile App mit <1000 DAU reicht das locker.

---

# Backup: Cloudflare Workers

Falls Deno Deploy ausfällt oder du ein Failover möchtest.

## Vorteile Cloudflare

- Mehr Edge-Locations (schneller weltweit)
- 100k Requests/Tag (Free)
- Besseres Monitoring Dashboard
- KV Storage für Rate Limiting

## Setup

### 1. Wrangler CLI installieren

```bash
npm install -g wrangler
wrangler login
```

### 2. Projekt erstellen

```bash
mkdir helius-proxy-cf && cd helius-proxy-cf
wrangler init
```

### 3. `src/index.ts`

```typescript
export interface Env {
  HELIUS_RPC_URL: string;
}

const ALLOWED_METHODS = [
  'getAccountInfo',
  'getBalance',
  'getLatestBlockhash',
  'getTokenAccountsByOwner',
  'sendTransaction',
  'simulateTransaction',
  'getTransaction',
  'getSignatureStatuses',
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Nur POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Config prüfen
    if (!env.HELIUS_RPC_URL) {
      return jsonResponse({ error: 'Proxy misconfigured' }, 500);
    }

    try {
      const body: { method?: string } = await request.json();

      // Methoden-Whitelist
      if (body.method && !ALLOWED_METHODS.includes(body.method)) {
        return jsonResponse({ error: `Method '${body.method}' not allowed` }, 403);
      }

      // An Helius weiterleiten
      const response = await fetch(env.HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return jsonResponse(data, response.status);

    } catch (error) {
      console.error('Proxy error:', error);
      return jsonResponse({ error: 'Proxy error' }, 500);
    }
  },
};

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
```

### 4. `wrangler.toml`

```toml
name = "helius-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
# Nicht hier! Secrets nutzen

# Optional: Custom Domain
# routes = [
#   { pattern = "rpc-cf.smartswap.app", custom_domain = true }
# ]
```

### 5. Secret setzen & deployen

```bash
# Secret setzen (wird verschlüsselt gespeichert)
wrangler secret put HELIUS_RPC_URL
# Eingabe: https://mainnet.helius-rpc.com/?api-key=DEIN_KEY

# Deployen
wrangler deploy
```

### 6. Testen

```bash
curl -X POST https://helius-proxy.DEIN-ACCOUNT.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}'
```

---

## Failover in der App

Mit beiden Proxies kannst du ein einfaches Failover bauen:

### `app/solana/rpc.ts`

```typescript
const RPC_ENDPOINTS = [
  process.env.EXPO_PUBLIC_RPC_URL_PRIMARY,   // Deno Deploy
  process.env.EXPO_PUBLIC_RPC_URL_FALLBACK,  // Cloudflare Workers
].filter(Boolean) as string[];

async function rpcRequest<T>(method: string, params: unknown[] = []): Promise<T> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  });

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result as T;
    } catch (error) {
      console.warn(`RPC endpoint ${endpoint} failed:`, error);
      // Nächsten Endpoint versuchen
      continue;
    }
  }

  throw new Error('All RPC endpoints failed');
}

export { rpcRequest };
```

### `.env.production`

```bash
EXPO_PUBLIC_RPC_URL_PRIMARY=https://helius-proxy.deno.dev
EXPO_PUBLIC_RPC_URL_FALLBACK=https://helius-proxy.workers.dev
```

---

## Vergleich

| | Deno Deploy | Cloudflare Workers |
|---|---|---|
| **Setup** | Einfacher (GitHub UI) | CLI-basiert |
| **Free Tier** | 100k req/Tag | 100k req/Tag |
| **Edge Locations** | ~35 | ~300+ |
| **Cold Start** | ~50ms | ~0ms |
| **Monitoring** | Basic | Detailliert |
| **KV Storage** | Deno KV (Beta) | Workers KV |

**Empfehlung:** Deno als Primary (einfacher), Cloudflare als Fallback (robuster).

/**
 * HTTP MCP server for claude.ai remote integration.
 *
 * Multi-user: each user has a personal API key stored in the mcp_api_keys table.
 * The OAuth authorize page prompts for that key; the key becomes the bearer token.
 * verifyAccessToken looks up the key to find the user_id for each request.
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BASE_URL
 * Optional: PORT (default 3001)
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { createMcpServer } from './server.js';
import { createRestRouter, buildOpenApiSpec } from './rest.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import type { OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// ── Config ────────────────────────────────────────────────────────────────────

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PORT = '3001',
  BASE_URL,
} = process.env;

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BASE_URL })) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as any },
});

// ── OAuth state (in-memory — codes expire in 10 min) ─────────────────────────

const registeredClients = new Map<string, OAuthClientInformationFull>();
const pendingCodes = new Map<string, {
  challenge: string;
  clientId: string;
  userId: string;
  apiKey: string;
}>();

const clientsStore: OAuthRegisteredClientsStore = {
  getClient(clientId) {
    return registeredClients.get(clientId);
  },
  registerClient(meta) {
    const clientId = `rf_${crypto.randomBytes(8).toString('hex')}`;
    const client: OAuthClientInformationFull = {
      ...meta,
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };
    registeredClients.set(clientId, client);
    return client;
  },
};

// ── OAuth Provider ─────────────────────────────────────────────────────────────

const provider: OAuthServerProvider = {
  get clientsStore(): OAuthRegisteredClientsStore { return clientsStore; },

  async authorize(client, params, res) {
    // Render a form asking the user to enter their personal API key.
    // The form POSTs to /connect with all OAuth params as hidden fields.
    const encRedirect = encodeURIComponent(params.redirectUri);
    const encState = encodeURIComponent(params.state ?? '');
    const encChallenge = encodeURIComponent(params.codeChallenge);
    const encClient = encodeURIComponent(client.client_id);

    res.send(`<!DOCTYPE html><html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RelieFitness · Connect</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#09090f;color:#f5f5f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#141419;border:1px solid #1f2028;border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:700;margin-bottom:8px}
    p{color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px}
    .scope{background:#1a2e1a;border:1px solid #22c55e30;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#4ade80;text-align:left}
    label{display:block;text-align:left;font-size:12px;font-weight:600;color:#9ca3af;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
    input[type=text]{width:100%;background:#0d0d12;border:1px solid #2a2a38;border-radius:10px;padding:12px 14px;font-size:14px;color:#f5f5f0;font-family:monospace;margin-bottom:16px;outline:none}
    input[type=text]:focus{border-color:#22c55e50}
    .hint{font-size:12px;color:#4b5563;margin-bottom:20px;text-align:left}
    .hint a{color:#22c55e;text-decoration:none}
    button{width:100%;background:#22c55e;color:#000;border:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer}
    button:hover{background:#16a34a}
    .err{color:#f87171;font-size:13px;margin-bottom:12px;display:none}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">💪</div>
    <h1>RelieFitness</h1>
    <p>Connect Claude to your personal health data.</p>
    <div class="scope">✓ Read meals, weight, workouts, drinks<br>✓ Log new entries<br>✓ Update goals</div>
    <form method="POST" action="/connect">
      <input type="hidden" name="redirect_uri" value="${encRedirect}">
      <input type="hidden" name="state" value="${encState}">
      <input type="hidden" name="code_challenge" value="${encChallenge}">
      <input type="hidden" name="client_id" value="${encClient}">
      <label for="api_key">Your API Key</label>
      <input type="text" id="api_key" name="api_key" placeholder="mk_xxxxxxxx..." autocomplete="off" spellcheck="false">
      <p class="hint">Find your key in the RelieFitness app → Settings → MCP Connection</p>
      <div class="err" id="err"></div>
      <button type="submit">Connect</button>
    </form>
  </div>
</body></html>`);
  },

  async challengeForAuthorizationCode(_client, code) {
    const p = pendingCodes.get(code);
    if (!p) throw new Error('Invalid or expired authorization code');
    return p.challenge;
  },

  async exchangeAuthorizationCode(_client, code): Promise<OAuthTokens> {
    const p = pendingCodes.get(code);
    if (!p) throw new Error('Invalid or expired authorization code');
    pendingCodes.delete(code);
    return {
      access_token: p.apiKey,
      token_type: 'Bearer',
      expires_in: 31536000,
      scope: 'health:read health:write',
    };
  },

  async exchangeRefreshToken(): Promise<OAuthTokens> {
    throw new Error('Refresh tokens not supported');
  },

  async verifyAccessToken(token): Promise<AuthInfo> {
    const { data, error } = await supabase
      .from('mcp_api_keys')
      .select('user_id')
      .eq('api_key', token)
      .single();

    if (error || !data) throw new Error('Invalid or revoked API key');

    return {
      token,
      clientId: 'reliefitness-client',
      scopes: ['health:read', 'health:write'],
      expiresAt: Math.floor(Date.now() / 1000) + 31536000,
      extra: { userId: data.user_id },
    };
  },
};

// ── Express App ───────────────────────────────────────────────────────────────

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
  exposedHeaders: ['mcp-session-id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── /connect — validate API key and issue OAuth code ─────────────────────────

app.post('/connect', async (req, res) => {
  const { api_key, redirect_uri, state, code_challenge, client_id } = req.body as Record<string, string>;

  const redirectUri = decodeURIComponent(redirect_uri ?? '');
  const decodedState = decodeURIComponent(state ?? '');
  const challenge = decodeURIComponent(code_challenge ?? '');
  const clientId = decodeURIComponent(client_id ?? '');

  if (!api_key || !redirectUri || !challenge) {
    res.status(400).send('Missing required parameters');
    return;
  }

  // Validate API key against DB
  const { data, error } = await supabase
    .from('mcp_api_keys')
    .select('user_id')
    .eq('api_key', api_key.trim())
    .single();

  if (error || !data) {
    res.status(400).send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><title>Invalid Key</title>
<style>body{font-family:-apple-system,sans-serif;background:#09090f;color:#f5f5f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{background:#141419;border:1px solid #3f1313;border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center}
h1{color:#f87171;font-size:20px;margin-bottom:12px}.back{display:inline-block;margin-top:20px;color:#22c55e;text-decoration:none;font-size:14px}</style>
</head><body><div class="card"><h1>Invalid API Key</h1>
<p style="color:#9ca3af;font-size:14px">That key doesn't match any RelieFitness account. Please check your key in Settings → MCP Connection.</p>
<a class="back" href="javascript:history.back()">← Try again</a></div></body></html>`);
    return;
  }

  const code = crypto.randomBytes(16).toString('hex');
  pendingCodes.set(code, {
    challenge,
    clientId,
    userId: data.user_id,
    apiKey: api_key.trim(),
  });
  setTimeout(() => pendingCodes.delete(code), 10 * 60 * 1000);

  const cb = new URL(redirectUri);
  cb.searchParams.set('code', code);
  if (decodedState) cb.searchParams.set('state', decodedState);
  res.redirect(cb.toString());
});

// ── OAuth router — registers /.well-known/* and /oauth/* ─────────────────────

const issuerUrl = new URL(BASE_URL!);
app.use(mcpAuthRouter({ provider, issuerUrl }));

// ── MCP Streamable HTTP Transport ─────────────────────────────────────────────

const transports = new Map<string, StreamableHTTPServerTransport>();

const bearerAuth = requireBearerAuth({
  verifier: provider,
  resourceMetadataUrl: `${BASE_URL}/.well-known/oauth-protected-resource`,
});

async function mcpHandler(req: express.Request, res: express.Response): Promise<void> {
  const authInfo = res.locals.auth as AuthInfo | undefined;
  const userId = authInfo?.extra?.userId as string | undefined;

  if (!userId) {
    res.status(401).json({ error: 'Unable to determine user identity' });
    return;
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!;
  } else if (req.method === 'POST' && !sessionId) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomBytes(16).toString('hex'),
      onsessioninitialized: (id) => { transports.set(id, transport); },
    });
    transport.onclose = () => {
      if (transport.sessionId) transports.delete(transport.sessionId);
    };
    const mcpServer = createMcpServer(supabase, userId);
    await mcpServer.connect(transport);
  } else {
    res.status(404).json({ error: 'Session not found or invalid request' });
    return;
  }

  await transport.handleRequest(req, res, req.body);
}

for (const path of ['/', '/mcp']) {
  app.post(path, bearerAuth, mcpHandler);
  app.get(path, bearerAuth, mcpHandler);
  app.delete(path, bearerAuth, async (req, res) => {
    const id = req.headers['mcp-session-id'] as string | undefined;
    if (id) transports.delete(id);
    res.status(200).json({ ok: true });
  });
}

// ── REST API (for GPT Custom Actions and other non-MCP clients) ───────────────

app.use('/api', createRestRouter(supabase));

// ── OpenAPI spec (for GPT Actions setup) ─────────────────────────────────────

app.get('/openapi.json', (_req, res) => {
  res.json(buildOpenApiSpec(BASE_URL!));
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'reliefitness-mcp', base: BASE_URL });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(parseInt(PORT), () => {
  console.log(`RelieFitness MCP HTTP on :${PORT} — ${BASE_URL}`);
});

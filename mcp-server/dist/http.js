/**
 * HTTP MCP server for claude.ai remote integration.
 *
 * Uses the MCP SDK's built-in OAuth router (RFC 7591 + PKCE) and
 * StreamableHTTP transport (the protocol claude.ai expects).
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                    HEALTH_USER_ID, MCP_ACCESS_TOKEN, BASE_URL
 *
 * BASE_URL must be your Railway public URL, e.g.:
 *   https://reliefitness-mcp-production.up.railway.app
 */
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { createMcpServer } from './server.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
// ── Config ────────────────────────────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HEALTH_USER_ID, MCP_ACCESS_TOKEN, PORT = '3001', BASE_URL, } = process.env;
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HEALTH_USER_ID, MCP_ACCESS_TOKEN, BASE_URL })) {
    if (!v) {
        console.error(`Missing env var: ${k}`);
        process.exit(1);
    }
}
// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: ws },
});
// ── OAuth state (in-memory — fine for personal single-user server) ─────────────
const registeredClients = new Map();
const pendingCodes = new Map();
const clientsStore = {
    getClient(clientId) {
        return registeredClients.get(clientId);
    },
    registerClient(meta) {
        const clientId = `rf_${crypto.randomBytes(8).toString('hex')}`;
        const client = {
            ...meta,
            client_id: clientId,
            client_id_issued_at: Math.floor(Date.now() / 1000),
        };
        registeredClients.set(clientId, client);
        return client;
    },
};
// ── OAuth Provider ─────────────────────────────────────────────────────────────
const provider = {
    get clientsStore() { return clientsStore; },
    async authorize(client, params, res) {
        const code = crypto.randomBytes(16).toString('hex');
        pendingCodes.set(code, { challenge: params.codeChallenge, clientId: client.client_id });
        setTimeout(() => pendingCodes.delete(code), 10 * 60 * 1000);
        const cb = new URL(params.redirectUri);
        cb.searchParams.set('code', code);
        if (params.state)
            cb.searchParams.set('state', params.state);
        const href = cb.toString().replace(/&/g, '&amp;');
        res.send(`<!DOCTYPE html><html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RelieFitness · Allow Access</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#09090f;color:#f5f5f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#141419;border:1px solid #1f2028;border-radius:20px;padding:40px 32px;max-width:380px;width:100%;text-align:center}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:700;margin-bottom:8px}
    p{color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:28px}
    .allow{display:inline-block;background:#22c55e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px}
    .scope{background:#1a2e1a;border:1px solid #22c55e30;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#4ade80;text-align:left}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">💪</div>
    <h1>RelieFitness</h1>
    <p>Claude is requesting access to your health tracking data.</p>
    <div class="scope">✓ Read meals, weight, workouts, drinks<br>✓ Log new entries<br>✓ Update goals</div>
    <a href="${href}" class="allow">Allow Access</a>
  </div>
</body></html>`);
    },
    async challengeForAuthorizationCode(_client, code) {
        const p = pendingCodes.get(code);
        if (!p)
            throw new Error('Invalid or expired authorization code');
        return p.challenge;
    },
    async exchangeAuthorizationCode(_client, code) {
        const p = pendingCodes.get(code);
        if (!p)
            throw new Error('Invalid or expired authorization code');
        pendingCodes.delete(code);
        return {
            access_token: MCP_ACCESS_TOKEN,
            token_type: 'Bearer',
            expires_in: 31536000,
            scope: 'health:read health:write',
        };
    },
    async exchangeRefreshToken() {
        throw new Error('Refresh tokens not supported');
    },
    async verifyAccessToken(token) {
        if (token !== MCP_ACCESS_TOKEN)
            throw new Error('Invalid token');
        return {
            token,
            clientId: 'reliefitness-client',
            scopes: ['health:read', 'health:write'],
            expiresAt: Math.floor(Date.now() / 1000) + 31536000,
        };
    },
};
// ── Express App ───────────────────────────────────────────────────────────────
const app = express();
// Trust Railway's reverse proxy so req.protocol returns 'https'
app.set('trust proxy', true);
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
    exposedHeaders: ['mcp-session-id'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// SDK OAuth router — registers /.well-known/* and /oauth/* endpoints with
// proper metadata, PKCE, dynamic client registration, and token exchange.
const issuerUrl = new URL(BASE_URL);
app.use(mcpAuthRouter({ provider, issuerUrl }));
// ── MCP Streamable HTTP Transport ─────────────────────────────────────────────
const transports = new Map();
const bearerAuth = requireBearerAuth({
    verifier: provider,
    resourceMetadataUrl: `${BASE_URL}/.well-known/oauth-protected-resource`,
});
async function mcpHandler(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    let transport;
    if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId);
    }
    else if (req.method === 'POST' && !sessionId) {
        // New session — create transport and connect MCP server
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomBytes(16).toString('hex'),
            onsessioninitialized: (id) => { transports.set(id, transport); },
        });
        transport.onclose = () => {
            if (transport.sessionId)
                transports.delete(transport.sessionId);
        };
        const mcpServer = createMcpServer(supabase, HEALTH_USER_ID);
        await mcpServer.connect(transport);
    }
    else {
        res.status(404).json({ error: 'Session not found or invalid request' });
        return;
    }
    await transport.handleRequest(req, res, req.body);
}
// Handle MCP at root (user enters Railway URL directly) and /mcp
for (const path of ['/', '/mcp']) {
    app.post(path, bearerAuth, mcpHandler);
    app.get(path, bearerAuth, mcpHandler);
    app.delete(path, bearerAuth, async (req, res) => {
        const id = req.headers['mcp-session-id'];
        if (id)
            transports.delete(id);
        res.status(200).json({ ok: true });
    });
}
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'reliefitness-mcp', base: BASE_URL });
});
// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(parseInt(PORT), () => {
    console.log(`RelieFitness MCP HTTP on :${PORT} — ${BASE_URL}`);
});

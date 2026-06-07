/**
 * HTTP + SSE MCP server for claude.ai remote integration.
 * Implements a minimal OAuth 2.0 flow (personal use — no real user DB needed).
 *
 * Deploy to Railway: connect this repo, set env vars, done.
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { createMcpServer } from './server.js';

// ── Config ────────────────────────────────────────────────────────────────────

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  HEALTH_USER_ID,
  MCP_ACCESS_TOKEN,
  PORT = '3001',
} = process.env;

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HEALTH_USER_ID, MCP_ACCESS_TOKEN })) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws as any },
});

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
  exposedHeaders: ['mcp-session-id'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── OAuth 2.0 (minimal personal implementation) ───────────────────────────────
// claude.ai discovers this via /.well-known/oauth-authorization-server

// One-time auth codes (in-memory, reset on restart — fine for personal use)
const pendingCodes = new Map<string, { redirectUri: string; state: string; pkce: string }>();

app.get('/.well-known/oauth-authorization-server', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['health:read', 'health:write'],
  });
});

// Dynamic client registration (RFC 7591) — claude.ai calls this before starting OAuth
app.post('/oauth/register', (req, res) => {
  const meta = req.body ?? {};
  const clientId = crypto.randomBytes(8).toString('hex');
  res.status(201).json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: meta.redirect_uris ?? [],
    grant_types: meta.grant_types ?? ['authorization_code'],
    response_types: meta.response_types ?? ['code'],
    token_endpoint_auth_method: 'none',
    ...(meta.client_name ? { client_name: meta.client_name } : {}),
  });
});

// Shows a simple "Allow Access" page — no login needed for personal server
app.get('/oauth/authorize', (req, res) => {
  const { redirect_uri = '', state = '', code_challenge = '' } = req.query as Record<string, string>;
  const code = crypto.randomBytes(16).toString('hex');
  pendingCodes.set(code, { redirectUri: redirect_uri, state, pkce: code_challenge });

  // Auto-expire after 5 minutes
  setTimeout(() => pendingCodes.delete(code), 5 * 60 * 1000);

  const redirectUrl = `${redirect_uri}?code=${code}&state=${encodeURIComponent(state)}`;

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RelieFitness · Allow Access</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #09090f; color: #f5f5f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #141419; border: 1px solid #1f2028; border-radius: 20px; padding: 40px 32px; max-width: 380px; width: 100%; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
    .allow { display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; transition: opacity .15s; }
    .allow:hover { opacity: .9; }
    .scope { background: #1a2e1a; border: 1px solid #22c55e30; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #4ade80; text-align: left; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">💪</div>
    <h1>RelieFitness</h1>
    <p>Claude is requesting access to your health tracking data.</p>
    <div class="scope">✓ Read meals, weight, workouts, drinks<br>✓ Log new entries<br>✓ Update goals</div>
    <a href="${redirectUrl}" class="allow">Allow Access</a>
  </div>
</body>
</html>`);
});

// Exchanges auth code → access token
app.post('/oauth/token', (req, res) => {
  const { code, grant_type, code_verifier } = req.body;

  if (grant_type !== 'authorization_code') {
    res.status(400).json({ error: 'unsupported_grant_type' });
    return;
  }

  const pending = pendingCodes.get(code);
  if (!pending) {
    res.status(400).json({ error: 'invalid_grant', error_description: 'Code not found or expired.' });
    return;
  }

  // Verify PKCE (S256)
  if (pending.pkce) {
    const expected = crypto
      .createHash('sha256')
      .update(code_verifier ?? '')
      .digest('base64url');
    if (expected !== pending.pkce) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed.' });
      return;
    }
  }

  pendingCodes.delete(code);

  res.json({
    access_token: MCP_ACCESS_TOKEN!,
    token_type: 'Bearer',
    expires_in: 60 * 60 * 24 * 365, // 1 year
    scope: 'health:read health:write',
  });
});

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireBearer(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== MCP_ACCESS_TOKEN) {
    res.status(401).json({ error: 'invalid_token' });
    return;
  }
  next();
}

// ── MCP over SSE ──────────────────────────────────────────────────────────────

const transports = new Map<string, SSEServerTransport>();

// claude.ai connects here first — establishes the SSE stream
app.get('/sse', requireBearer, async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  const mcpServer = createMcpServer(supabase, HEALTH_USER_ID!);

  await mcpServer.connect(transport);
  transports.set(transport.sessionId, transport);

  res.on('close', () => {
    transports.delete(transport.sessionId);
    mcpServer.close().catch(() => {});
  });
});

// claude.ai sends tool calls here
app.post('/messages', requireBearer, async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: 'Session not found or expired.' });
    return;
  }
  await transport.handlePostMessage(req, res, req.body);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'reliefitness-mcp' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(parseInt(PORT), () => {
  console.log(`RelieFitness MCP HTTP server on port ${PORT}`);
});

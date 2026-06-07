// stdio transport — for Claude Code / Claude Desktop
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { createMcpServer } from './server.js';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HEALTH_USER_ID } = process.env;
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HEALTH_USER_ID })) {
    if (!v) {
        console.error(`Missing env var: ${k}`);
        process.exit(1);
    }
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: ws },
});
async function main() {
    const server = createMcpServer(supabase, HEALTH_USER_ID);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('RelieFitness MCP stdio server running');
}
main().catch((err) => { console.error(err); process.exit(1); });

-- Per-user MCP API keys for multi-user MCP access
CREATE TABLE mcp_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key text NOT NULL UNIQUE DEFAULT 'mk_' || encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mcp_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only read/manage their own key; service role bypasses RLS for token verification
CREATE POLICY "own keys" ON mcp_api_keys
  FOR ALL USING (auth.uid() = user_id);

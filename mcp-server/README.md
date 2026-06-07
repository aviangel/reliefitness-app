# RelieFitness MCP Server

Exposes your health tracking data as Claude tools. Two modes:

| Mode | Transport | Use with |
|------|-----------|----------|
| **stdio** | stdin/stdout | Claude Code CLI, Claude Desktop |
| **HTTP/SSE** | Express + OAuth | **claude.ai** (web) |

---

## Connecting to claude.ai (web)

This requires deploying the HTTP server publicly so claude.ai can reach it.

### Step 1 — Deploy to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select the `reliefitness-app` repo, set the **Root Directory** to `mcp-server`
3. Railway auto-detects Node.js. Set the **Start Command** to: `npm run start:http`
4. Set these environment variables in Railway's dashboard:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://bxsbkraloitwcaiyaemw.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → `service_role` |
| `HEALTH_USER_ID` | From Supabase → Authentication → Users → your UID |
| `MCP_ACCESS_TOKEN` | Any strong random string (run `openssl rand -hex 32`) |

5. After deploy, Railway gives you a URL like `https://reliefitness-mcp-production.up.railway.app`

### Step 2 — Add to claude.ai

1. Open [claude.ai](https://claude.ai) → click your profile → **Settings**
2. Go to **Integrations** → **Add MCP Server**
3. Enter your Railway URL: `https://your-app.up.railway.app`
4. claude.ai will open an OAuth popup → click **Allow Access**
5. Done — Claude can now read and update your health data

### What Claude can do

```
"What have I eaten today? How many calories left?"
"Log my lunch — chicken schnitzel with white rice"
"I weigh 101.2 kg this morning"
"Log 500ml of water"
"I did 60 min gym, chest and back day"
"How's my week looking? Show calorie average and weight trend"
"I slipped and ate 3 Klik bars — log it"
"Set my calorie goal to 1850"
```

---

## Connecting to Claude Code / Claude Desktop (stdio)

No deployment needed — runs locally.

### 1. Build

```bash
cd mcp-server
cp .env.example .env   # fill in the values
npm install
npm run build
```

### 2. Configure Claude Code

Add to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "reliefitness": {
      "command": "node",
      "args": ["/absolute/path/to/reliefitness-app/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://bxsbkraloitwcaiyaemw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "...",
        "HEALTH_USER_ID": "..."
      }
    }
  }
}
```

---

## Available Tools (16)

| Tool | Description |
|------|-------------|
| `get_today` | Full summary: calories, macros, water, weight, workouts |
| `get_meals` | Meal log for a date |
| `get_weight_history` | Weight history (last N entries) |
| `get_drinks` | Drink log for a date |
| `get_workouts` | Recent workout sessions |
| `get_profile` | Profile, weight targets, daily goals |
| `get_slips` | Dietary slip log |
| `get_weekly_stats` | 7-day averages and trends |
| `list_foods` | Search the food database |
| `log_meal` | Log a meal (uses `list_foods` for exact name) |
| `delete_meal` | Delete a meal entry by ID |
| `log_weight` | Log body weight |
| `log_drink` | Log water / zero / diet coke |
| `log_workout` | Log a workout session |
| `log_slip` | Log a dietary slip |
| `update_goals` | Update calorie/macro goals |

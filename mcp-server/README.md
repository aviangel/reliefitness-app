# RelieFitness MCP Server

A Model Context Protocol server that lets Claude read and update your health data directly — log meals, weight, drinks, and workouts by chatting with Claude.

## Setup

### 1. Get your credentials

You need three values from Supabase:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key |
| `HEALTH_USER_ID` | Supabase Dashboard → Authentication → Users → your user row → User UID |

### 2. Create your `.env` file

```bash
cd mcp-server
cp .env.example .env
# Fill in the three values above
```

### 3. Build

```bash
npm install
npm run build
```

## Connecting to Claude

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "reliefitness": {
      "command": "node",
      "args": ["/absolute/path/to/reliefitness-app/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://bxsbkraloitwcaiyaemw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key",
        "HEALTH_USER_ID": "your_user_id"
      }
    }
  }
}
```

### Claude Code (CLI)

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "reliefitness": {
      "command": "node",
      "args": ["/absolute/path/to/reliefitness-app/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://bxsbkraloitwcaiyaemw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key",
        "HEALTH_USER_ID": "your_user_id"
      }
    }
  }
}
```

Or use `tsx` for development (no build step needed):

```json
{
  "command": "npx",
  "args": ["tsx", "/path/to/mcp-server/src/index.ts"]
}
```

## Available Tools

| Tool | What it does |
|---|---|
| `get_today` | Full summary: calories, macros, water, weight, workouts |
| `get_meals` | Meal log for a date |
| `get_weight_history` | Weight log history |
| `get_drinks` | Drink log for a date |
| `get_workouts` | Recent workout sessions |
| `get_profile` | Profile, goals, weight targets |
| `get_slips` | Dietary slip log |
| `get_weekly_stats` | 7-day averages, trends, workout frequency |
| `list_foods` | Search the food database |
| `log_meal` | Log a meal (use `list_foods` first to find the exact name) |
| `log_weight` | Log body weight |
| `log_drink` | Log water / zero / diet coke |
| `log_workout` | Log a workout session |
| `log_slip` | Log a dietary slip |
| `update_goals` | Update daily calorie/macro goals |
| `delete_meal` | Delete a meal log entry |

## Example prompts

```
"What have I eaten today and how many calories are left?"
"Log my lunch — I had chicken schnitzel with rice"
"I weigh 101.2 kg this morning"
"Log 500ml of water"
"I did 60 minutes at the gym today, chest and back"
"How am I doing this week? Show me my calorie average and weight trend"
"I had 3 Klik bars after dinner — log it as a slip"
"Set my calorie goal to 1900"
```

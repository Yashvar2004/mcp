# MCP Weather & AQI Project

A complete **Model Context Protocol (MCP)** implementation featuring a weather server with **spec-compliant MCP Apps UI** and an AI-powered client with terminal widget rendering.

## What is MCP Apps?

[MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) is an extension to the MCP specification that allows servers to return **interactive HTML interfaces** that render directly inside MCP hosts like Claude Desktop, VS Code Copilot, and ChatGPT Apps.

This server implements MCP Apps using the official [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps) package. When a host calls a tool, it fetches the linked `ui://` HTML resource and renders it in a sandboxed iframe with bidirectional postMessage communication.

## Project Structure

```
mcp/
├── server/                         # MCP Weather Server
│   ├── src/
│   │   ├── index.js               # HTTP server (Streamable HTTP)
│   │   ├── index-stdio.js         # stdio server (for Claude Desktop)
│   │   ├── server.js              # McpServer factory (MCP Apps resources)
│   │   ├── config.js              # Configuration
│   │   ├── tools/
│   │   │   ├── weather.js         # search_weather + get_forecast
│   │   │   ├── aqi.js             # get_aqi
│   │   │   └── fullReport.js      # get_full_report
│   │   ├── helpers/
│   │   │   ├── api.js             # HTTP request wrapper
│   │   │   ├── geocoding.js       # City → coordinates
│   │   │   └── constants.js       # Weather codes, AQI levels
│   │   ├── auth/
│   │   │   ├── index.js           # Unified auth (Bearer, Auth0, Supabase, BetterAuth)
│   │   │   ├── auth0.js           # Auth0 JWT validation
│   │   │   ├── supabase.js        # Supabase JWT validation
│   │   │   └── betterauth.js      # BetterAuth session validation
│   │   └── ui/                    # MCP Apps HTML widgets
│   │       ├── weather.html       # Weather card (ui://weather/card)
│   │       ├── aqi.html           # AQI card (ui://aqi/card)
│   │       ├── forecast.html      # Forecast card (ui://forecast/card)
│   │       └── fullReport.html    # Full report card (ui://fullreport/card)
│   └── package.json
│
└── client/                         # AI-Powered MCP Client
    ├── client.js                   # Main client with LLM integration
    ├── demo.js                     # Quick demo script
    ├── lib/
    │   ├── llm.js                  # Groq/DeepSeek integration
    │   ├── mcp-raw.js              # Raw HTTP MCP client (no SDK)
    │   └── widgets.js              # Terminal widget rendering (ANSI fallback)
    └── package.json
```

## Quick Start

### 1. Start the MCP Server

```bash
cd server
npm install
npm start
```

Server runs at: `http://127.0.0.1:3000/mcp`

### 2. Run the AI Client

```bash
cd client
npm install
# Set your API key in .env file
node client.js
```

## MCP Server Tools

| Tool | Description | UI Resource |
|------|-------------|-------------|
| `search_weather` | Current weather for any city | `ui://weather/card` |
| `get_forecast` | 7-day weather forecast | `ui://forecast/card` |
| `get_aqi` | Air Quality Index with health advice | `ui://aqi/card` |
| `get_full_report` | Combined weather + AQI report | `ui://fullreport/card` |

Each tool links to its UI via `_meta.ui.resourceUri`. MCP-Apps-aware hosts fetch the HTML resource and render it in a sandboxed iframe.

## MCP Apps Implementation

This server is **spec-compliant** with the [MCP Apps extension](https://modelcontextprotocol.io/extensions/apps/overview):

- **Server-side**: Uses `registerAppTool()` and `registerAppResource()` from `@modelcontextprotocol/ext-apps`
- **Resources**: `ui://` URI scheme with `mimeType: text/html;profile=mcp-app`
- **Tool linking**: `_meta.ui.resourceUri` on all tool responses
- **HTML widgets**: Self-contained HTML/CSS/JS with MCP Apps postMessage protocol (`ui/initialize`, `ui/notifications/tool-result`)
- **Error handling**: `isError: true` on all error paths
- **Security**: Default restrictive CSP (no external resources)

### Host Compatibility

| Host | Supports MCP Apps |
|------|-------------------|
| Claude Desktop | Yes |
| Claude.ai (web) | Yes |
| VS Code Copilot | Yes |
| Microsoft 365 Copilot | Yes |
| Goose | Yes |
| Postman | Yes |

## Transport Options

### HTTP (Streamable HTTP)
- Endpoint: `http://127.0.0.1:3000/mcp`
- Stateless: fresh server + transport per request
- CORS enabled for cross-origin access

### stdio
- For Claude Desktop integration
- Command: `node src/index-stdio.js`
- Uses shared server factory (same tools + MCP Apps as HTTP)

## Testing

### Claude Desktop

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["C:\\path\\to\\server\\src\\index-stdio.js"]
    }
  }
}
```

Then ask Claude: "What's the weather in Delhi?" — it will call `search_weather` and render the weather card widget.

### Claude.ai (Web)

1. Start the HTTP server
2. Expose it via tunnel: `npx cloudflared tunnel --url http://localhost:3000`
3. Add as custom connector in Claude Settings > Connectors
4. Ask about weather — widgets render inline in the chat

### MCP Inspector

1. Open [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
2. Connect to: `http://127.0.0.1:3000/mcp`
3. Call any tool to see the response

## Authorization

The server supports multiple auth providers via environment variables:

### Bearer Token (simple)
```bash
MCP_API_KEY=your-secret-key npm start
```

### Auth0 (JWT)
```bash
AUTH_PROVIDER=auth0
AUTH0_DOMAIN=your-domain.us.auth0.com
AUTH0_AUDIENCE=your-api-audience
npm start
```

### Supabase (JWT)
```bash
AUTH_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
npm start
```

### BetterAuth (session)
```bash
AUTH_PROVIDER=betterauth
BETTER_AUTH_URL=https://your-auth-server.com
BETTER_AUTH_SECRET=your-secret
npm start
```

### No Auth (development)
```bash
# Don't set any auth environment variables
npm start
```

## Dependencies

### Server
- `@modelcontextprotocol/sdk` — MCP SDK
- `@modelcontextprotocol/ext-apps` — MCP Apps helpers (`registerAppTool`, `registerAppResource`)
- `zod` — Schema validation
- `jsonwebtoken` + `jwks-rsa` — JWT validation (Auth0, Supabase)

### Client
- `@modelcontextprotocol/sdk` — MCP SDK
- `dotenv` — Environment variables
- `openai` — For Groq/DeepSeek (OpenAI-compatible)

## Widget Rendering

### MCP Apps (HTML — spec-compliant)
The server returns HTML widgets that render in sandboxed iframes inside MCP hosts. Each widget uses the MCP Apps postMessage protocol for bidirectional communication.

### Terminal Widgets (ANSI — client fallback)
The client also has a terminal widget renderer for plain-text MCP clients:

```
  ┌──────────────────────────────────────────┐
  │ ☀️  Delhi, India                          │
  │                                          │
  │ 33°C  Feels like 35.8°C                  │
  │ Clear sky ☀️                             │
  │                                          │
  │ 💧 Humidity: 49%    💨 Wind: 9.9 km/h    │
  │ 🌧️ Rain: 0 mm       ☀️ UV: 2.65          │
  │ 📊 Pressure: 1002.7 hPa                  │
  └──────────────────────────────────────────┘
```

## Data Sources

- [Open-Meteo Weather API](https://open-meteo.com/) — Free, no API key
- [Open-Meteo Air Quality API](https://open-meteo.com/) — Free, no API key
- [Open-Meteo Geocoding API](https://open-meteo.com/) — City → coordinates

## References

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [MCP Apps Overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps Build Guide](https://modelcontextprotocol.io/extensions/apps/build)
- [MCP Apps GitHub](https://github.com/modelcontextprotocol/ext-apps)
- [MCP UI GitHub](https://github.com/MCP-UI-Org/mcp-ui)

## License

ISC
# MCP Weather & AQI Project

A complete **Model Context Protocol (MCP)** implementation featuring a weather server and an AI-powered client with widget rendering.

## 📁 Project Structure

```
mcp/
├── server/                    # MCP Weather Server
│   ├── src/
│   │   ├── index.js          # HTTP server (Streamable HTTP)
│   │   ├── index-stdio.js    # stdio server (for Claude Desktop)
│   │   ├── server.js         # McpServer factory
│   │   ├── config.js         # Configuration
│   │   ├── tools/
│   │   │   ├── weather.js    # search_weather + get_forecast
│   │   │   ├── aqi.js        # get_aqi
│   │   │   └── fullReport.js # get_full_report
│   │   └── helpers/
│   │       ├── api.js        # HTTP request wrapper
│   │       ├── geocoding.js  # City → coordinates
│   │       └── constants.js  # Weather codes, AQI levels
│   └── package.json
│
└── client/                    # AI-Powered MCP Client
    ├── client.js             # Main client with LLM integration
    ├── demo.js               # Quick demo script
    ├── lib/
    │   ├── llm.js            # Groq/DeepSeek integration
    │   ├── mcp-raw.js        # Raw HTTP MCP client
    │   └── widgets.js        # Terminal widget rendering
    └── package.json
```

## 🚀 Quick Start

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

## 🔧 MCP Server Tools

| Tool | Description |
|------|-------------|
| `search_weather` | Current weather for any city |
| `get_forecast` | 7-day weather forecast |
| `get_aqi` | Air Quality Index with health advice |
| `get_full_report` | Combined weather + AQI report |

## 📡 Transport Options

### HTTP (Streamable HTTP)
- Endpoint: `http://127.0.0.1:3000/mcp`
- Test with: MCP Inspector, curl, browser

### stdio
- For Claude Desktop integration
- Command: `node src/index-stdio.js`

## 🧪 Testing

### MCP Inspector
1. Open MCP Inspector
2. Connect to: `http://127.0.0.1:3000/mcp`
3. Call any tool

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

## 🔐 Authorization

The server supports API key authentication via Bearer token.

### Server (with auth):
```bash
MCP_API_KEY=your-secret-key npm start
```

### Client (with auth):
Add to `.env`:
```env
MCP_API_KEY=your-secret-key
```

### Without auth (development):
```bash
# Server: don't set MCP_API_KEY
npm start

# Client: don't set MCP_API_KEY
node client.js
```

## 📦 Dependencies

### Server
- `@modelcontextprotocol/sdk` - MCP SDK
- `zod` - Schema validation

### Client
- `@modelcontextprotocol/sdk` - MCP SDK
- `dotenv` - Environment variables
- `openai` - For Groq/DeepSeek (OpenAI-compatible)

## 🎨 Widget Rendering

The client renders beautiful terminal widgets:

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

## 📚 Data Sources

- [Open-Meteo Weather API](https://open-meteo.com/) - Free, no API key
- [Open-Meteo Air Quality API](https://open-meteo.com/) - Free, no API key
- [Open-Meteo Geocoding API](https://open-meteo.com/) - City → coordinates

## 📄 License

ISC

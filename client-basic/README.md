# MCP Basic Client

A rule-based MCP client with keyword routing and widget rendering. No AI/API key needed.

## Features

- **No API Key**: Uses keyword matching (no LLM required)
- **Widget Rendering**: Beautiful terminal cards
- **Dual Transport**: HTTP and stdio support
- **Lightweight**: Fast response, no external dependencies

## Installation

```bash
npm install
```

## Usage

### Interactive Mode (asks for transport)
```bash
node client.js
```

### HTTP Mode
```bash
node client.js --http http://127.0.0.1:3000/mcp
```

### stdio Mode
```bash
node client.js --stdio /path/to/server/src/index-stdio.js
```

## Example Queries

```
mcp> weather in Delhi
mcp> forecast Mumbai
mcp> aqi Bangalore
mcp> full report Loni
mcp> help
mcp> quit
```

## Widget Output

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

## How It Works

1. User types natural language query
2. Router matches keywords to tools
3. Tool executed via MCP
4. JSON response parsed
5. Widget rendered in terminal

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK

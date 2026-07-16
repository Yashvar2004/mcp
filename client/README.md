# MCP AI Client

An AI-powered MCP client that uses LLMs to decide which tools to call and renders beautiful terminal widgets.

## Features

- **LLM-Driven**: Uses Groq (free) or DeepSeek to decide tool calls
- **Widget Rendering**: Beautiful terminal cards with colors and boxes
- **Conversation History**: Maintains context between queries
- **Multi-Language**: Understands English, Hindi, and more

## Installation

```bash
npm install
```

## Configuration

Create `.env` file:
```env
# Groq (FREE): starts with "gsk_"
LLM_API_KEY=gsk_your_key_here

# MCP Server URL
MCP_SERVER_URL=http://127.0.0.1:3000/mcp
```

Get free API key: https://console.groq.com

## Usage

### Interactive Mode
```bash
node client.js
```

### Demo Mode
```bash
node demo.js
```

## Example Queries

```
mcp> weather in Delhi
mcp> aqi Mumbai
mcp> forecast Bangalore
mcp> delhi ka mausam kaisa hai
mcp> compare delhi and mumbai weather
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

1. User sends natural language query
2. Query + tool schemas → LLM
3. LLM decides which tools to call
4. Tools executed via MCP
5. Results → LLM → natural language response
6. Widgets rendered in terminal

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK
- `dotenv` - Environment variables
- `openai` - For Groq/DeepSeek (OpenAI-compatible)

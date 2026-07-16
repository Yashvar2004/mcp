# MCP Weather & AQI Server

An MCP server providing real-time weather and air quality data for any city worldwide.

## Features

- **4 Tools**: `search_weather`, `get_forecast`, `get_aqi`, `get_full_report`
- **Dual Transport**: HTTP (Streamable HTTP) and stdio
- **Structured JSON Output**: Returns clean data for clients to render
- **Free API**: Uses Open-Meteo (no API key needed)

## Installation

```bash
npm install
```

## Usage

### HTTP Server (for MCP Inspector, custom clients)
```bash
npm start
# Server runs at http://127.0.0.1:3000/mcp
```

### stdio Server (for Claude Desktop)
```bash
npm run start:stdio
```

## Tools

### search_weather
Get current weather for any city.

```json
{
  "city": "Delhi"
}
```

Returns:
```json
{
  "type": "weather",
  "location": "Delhi, India",
  "temperature": 33.4,
  "feelsLike": 36.2,
  "humidity": 45,
  "condition": "Clear sky ☀️"
}
```

### get_forecast
Get 7-day weather forecast.

### get_aqi
Get Air Quality Index with health advice.

### get_full_report
Get combined weather + AQI report.

## Configuration

Edit `src/config.js` to change port or API URLs.

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK
- `zod` - Input validation

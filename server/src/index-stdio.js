// ─────────────────────────────────────────────────────────────
// stdio transport entry point — for Claude Desktop
//
// Uses the shared server.js factory so it has:
//   - All tools (search_weather, get_forecast, get_aqi, get_full_report)
//   - MCP Apps UI resources (ui://weather/card, etc.)
//   - _meta.ui.resourceUri on tool responses
// ─────────────────────────────────────────────────────────────

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("India Weather & AQI MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

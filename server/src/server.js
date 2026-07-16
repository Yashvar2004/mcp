// ─────────────────────────────────────────────────────────────
// Server factory — creates a fully-configured McpServer instance
// with all tools registered. Called per-request in HTTP mode.
// ─────────────────────────────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWeatherTools } from "./tools/weather.js";
import { registerAQITool } from "./tools/aqi.js";
import { registerFullReportTool } from "./tools/fullReport.js";

/**
 * Creates a new McpServer with all tools registered.
 * In stateless HTTP mode, a fresh instance is created per request,
 * so this must be cheap and side-effect-free.
 *
 * @returns {McpServer}
 */
export function createServer() {
  const server = new McpServer({
    name: "india-weather-aqi",
    version: "2.0.0",
  });

  // Register all tool groups
  registerWeatherTools(server);   // search_weather, get_forecast
  registerAQITool(server);        // get_aqi
  registerFullReportTool(server); // get_full_report

  return server;
}

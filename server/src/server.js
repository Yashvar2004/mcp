// ─────────────────────────────────────────────────────────────
// Server factory — creates a fully-configured McpServer instance
// with all tools registered AND MCP Apps UI resources.
//
// MCP Apps (formerly MCP UI):
//   - ui://weather/card — Weather widget HTML
//   - ui://aqi/card — AQI widget HTML
//   - ui://forecast/card — Forecast widget HTML
//   - ui://fullreport/card — Full report widget HTML
//
// Each tool links to its UI via _meta.ui.resourceUri
// ─────────────────────────────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWeatherTools } from "./tools/weather.js";
import { registerAQITool } from "./tools/aqi.js";
import { registerFullReportTool } from "./tools/fullReport.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read an HTML file from the ui directory
 */
async function readHtmlFile(filename) {
  try {
    const filePath = join(__dirname, "ui", filename);
    return await readFile(filePath, "utf-8");
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err.message);
    return null;
  }
}

/**
 * Creates a new McpServer with all tools and UI resources registered.
 *
 * @returns {McpServer}
 */
export function createServer() {
  const server = new McpServer({
    name: "india-weather-aqi",
    version: "2.0.0",
  });

  // ── Register UI Resources (MCP Apps) ────────────────────────

  server.resource(
    "weather-card",
    "ui://weather/card",
    {
      description: "Weather widget UI — renders current weather as an interactive card",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => {
      const html = await readHtmlFile("weather.html");
      return {
        contents: [{
          uri: "ui://weather/card",
          text: html || "<p>Widget unavailable</p>",
          mimeType: "text/html;profile=mcp-app",
        }],
      };
    }
  );

  server.resource(
    "aqi-card",
    "ui://aqi/card",
    {
      description: "AQI widget UI — renders air quality index as an interactive card",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => {
      const html = await readHtmlFile("aqi.html");
      return {
        contents: [{
          uri: "ui://aqi/card",
          text: html || "<p>Widget unavailable</p>",
          mimeType: "text/html;profile=mcp-app",
        }],
      };
    }
  );

  server.resource(
    "forecast-card",
    "ui://forecast/card",
    {
      description: "Forecast widget UI — renders 7-day forecast as an interactive card",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => {
      const html = await readHtmlFile("forecast.html");
      return {
        contents: [{
          uri: "ui://forecast/card",
          text: html || "<p>Widget unavailable</p>",
          mimeType: "text/html;profile=mcp-app",
        }],
      };
    }
  );

  server.resource(
    "fullreport-card",
    "ui://fullreport/card",
    {
      description: "Full report widget UI — renders complete weather + AQI report",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => {
      const html = await readHtmlFile("fullReport.html");
      return {
        contents: [{
          uri: "ui://fullreport/card",
          text: html || "<p>Widget unavailable</p>",
          mimeType: "text/html;profile=mcp-app",
        }],
      };
    }
  );

  // ── Register Tools ──────────────────────────────────────────

  registerWeatherTools(server);   // search_weather, get_forecast
  registerAQITool(server);        // get_aqi
  registerFullReportTool(server); // get_full_report

  return server;
}

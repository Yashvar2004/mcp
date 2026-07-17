// ─────────────────────────────────────────────────────────────
// Server factory — creates a fully-configured McpServer instance
// with all tools registered AND MCP Apps UI resources.
//
// Uses @modelcontextprotocol/ext-apps for spec-compliant MCP Apps:
//   - registerAppTool() for tools with _meta.ui.resourceUri
//   - registerAppResource() for ui:// HTML resources
//   - RESOURCE_MIME_TYPE for text/html;profile=mcp-app
//
// UI Resources:
//   - ui://weather/card — Weather widget HTML
//   - ui://aqi/card — AQI widget HTML
//   - ui://forecast/card — Forecast widget HTML
//   - ui://fullreport/card — Full report widget HTML
// ─────────────────────────────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
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
  // These serve the HTML widgets that hosts render in sandboxed iframes.

  registerAppResource(
    server,
    "Weather Card",
    "ui://weather/card",
    {
      description: "Weather widget UI — renders current weather as an interactive card",
    },
    async () => {
      const html = await readHtmlFile("weather.html");
      return {
        contents: [{
          uri: "ui://weather/card",
          mimeType: RESOURCE_MIME_TYPE,
          text: html || "<p>Widget unavailable</p>",
        }],
      };
    }
  );

  registerAppResource(
    server,
    "AQI Card",
    "ui://aqi/card",
    {
      description: "AQI widget UI — renders air quality index as an interactive card",
    },
    async () => {
      const html = await readHtmlFile("aqi.html");
      return {
        contents: [{
          uri: "ui://aqi/card",
          mimeType: RESOURCE_MIME_TYPE,
          text: html || "<p>Widget unavailable</p>",
        }],
      };
    }
  );

  registerAppResource(
    server,
    "Forecast Card",
    "ui://forecast/card",
    {
      description: "Forecast widget UI — renders 7-day forecast as an interactive card",
    },
    async () => {
      const html = await readHtmlFile("forecast.html");
      return {
        contents: [{
          uri: "ui://forecast/card",
          mimeType: RESOURCE_MIME_TYPE,
          text: html || "<p>Widget unavailable</p>",
        }],
      };
    }
  );

  registerAppResource(
    server,
    "Full Report Card",
    "ui://fullreport/card",
    {
      description: "Full report widget UI — renders complete weather + AQI report",
    },
    async () => {
      const html = await readHtmlFile("fullReport.html");
      return {
        contents: [{
          uri: "ui://fullreport/card",
          mimeType: RESOURCE_MIME_TYPE,
          text: html || "<p>Widget unavailable</p>",
        }],
      };
    }
  );

  // ── Register Tools (via ext-apps helpers) ────────────────────
  // These register tools with _meta.ui.resourceUri linking to the UI resources above.

  registerWeatherTools(server, registerAppTool);
  registerAQITool(server, registerAppTool);
  registerFullReportTool(server, registerAppTool);

  return server;
}

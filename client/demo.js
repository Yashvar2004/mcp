// ── Quick Demo — Tests widget rendering with live data ──────

import "dotenv/config";
import { initialize, listTools, callTool } from "./lib/mcp-raw.js";
import { renderWidget } from "./lib/widgets.js";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://127.0.0.1:3000/mcp";
const MCP_API_KEY = process.env.MCP_API_KEY || null;

async function demo() {
  console.log("\n  🚀 Connecting to MCP server...\n");
  if (MCP_API_KEY) {
    console.log("  🔑 Using API key for authorization\n");
  }

  const init = await initialize(MCP_SERVER_URL, MCP_API_KEY);
  console.log(`  ✅ Connected to: ${init.serverInfo.name} v${init.serverInfo.version}\n`);

  const tools = await listTools(MCP_SERVER_URL, MCP_API_KEY);
  console.log(`  📋 ${tools.tools.length} tools available\n`);

  // Test 1: Weather
  console.log("  ─── Test 1: Weather ───────────────────────");
  const weather = await callTool(MCP_SERVER_URL, "search_weather", { city: "Delhi" }, MCP_API_KEY);
  console.log(renderWidget(weather.content[0].text));

  // Test 2: AQI
  console.log("  ─── Test 2: AQI ───────────────────────────");
  const aqi = await callTool(MCP_SERVER_URL, "get_aqi", { city: "Mumbai" }, MCP_API_KEY);
  console.log(renderWidget(aqi.content[0].text));

  // Test 3: Forecast
  console.log("  ─── Test 3: Forecast ──────────────────────");
  const forecast = await callTool(MCP_SERVER_URL, "get_forecast", { city: "Bangalore" }, MCP_API_KEY);
  console.log(renderWidget(forecast.content[0].text));

  // Test 4: Full Report
  console.log("  ─── Test 4: Full Report ───────────────────");
  const full = await callTool(MCP_SERVER_URL, "get_full_report", { city: "Loni" }, MCP_API_KEY);
  console.log(renderWidget(full.content[0].text));

  console.log("  ✅ All widgets rendered successfully!\n");
}

demo().catch(err => {
  console.error(`  ❌ Error: ${err.message}`);
  process.exit(1);
});

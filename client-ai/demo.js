// ── Quick Demo — Tests widget rendering with live data ──────

import { initialize, listTools, callTool } from "./lib/mcp-raw.js";
import { renderWidget } from "./lib/widgets.js";

const MCP_SERVER_URL = "http://127.0.0.1:3000/mcp";

async function demo() {
  console.log("\n  🚀 Connecting to MCP server...\n");

  const init = await initialize(MCP_SERVER_URL);
  console.log(`  ✅ Connected to: ${init.serverInfo.name} v${init.serverInfo.version}\n`);

  const tools = await listTools(MCP_SERVER_URL);
  console.log(`  📋 ${tools.tools.length} tools available\n`);

  // Test 1: Weather
  console.log("  ─── Test 1: Weather ───────────────────────");
  const weather = await callTool(MCP_SERVER_URL, "search_weather", { city: "Delhi" });
  console.log(renderWidget(weather.content[0].text));

  // Test 2: AQI
  console.log("  ─── Test 2: AQI ───────────────────────────");
  const aqi = await callTool(MCP_SERVER_URL, "get_aqi", { city: "Mumbai" });
  console.log(renderWidget(aqi.content[0].text));

  // Test 3: Forecast
  console.log("  ─── Test 3: Forecast ──────────────────────");
  const forecast = await callTool(MCP_SERVER_URL, "get_forecast", { city: "Bangalore" });
  console.log(renderWidget(forecast.content[0].text));

  // Test 4: Full Report
  console.log("  ─── Test 4: Full Report ───────────────────");
  const full = await callTool(MCP_SERVER_URL, "get_full_report", { city: "Loni" });
  console.log(renderWidget(full.content[0].text));

  console.log("  ✅ All widgets rendered successfully!\n");
}

demo().catch(err => {
  console.error(`  ❌ Error: ${err.message}`);
  process.exit(1);
});

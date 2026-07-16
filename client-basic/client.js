// ═══════════════════════════════════════════════════════════════
// MCP INTERACTIVE CLIENT
// ═══════════════════════════════════════════════════════════════
//
// A terminal-based MCP client that:
//   1. Connects to an MCP server (stdio or HTTP)
//   2. Discovers available tools
//   3. Accepts natural language input
//   4. Routes to the right tool
//   5. Displays results
//
// Usage:
//   node client.js                  ← interactive mode (asks which transport)
//   node client.js --http URL       ← connect to HTTP server directly
//   node client.js --stdio SCRIPT   ← spawn stdio server directly
//
// ═══════════════════════════════════════════════════════════════

import { Client } from "@modelcontextprotocol/sdk/client";
import { ListToolsResultSchema, CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { createInterface } from "node:readline";
import { createStdioTransport } from "./transports/stdio.js";
import { createHttpTransport } from "./transports/http.js";
import { routeInput, getToolDescriptions } from "./lib/router.js";
import {
  displayToolResult,
  displayTools,
  displayConnected,
  displayHelp,
  displayError,
} from "./lib/display.js";

// ── State ────────────────────────────────────────────────────

let client = null;
let transport = null;
let availableTools = [];

// ── Readline Setup ───────────────────────────────────────────

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("mcp> ", handleInput);
}

// ── Connection ───────────────────────────────────────────────

async function connectHttp(url) {
  console.log(`\n  Connecting to HTTP server: ${url}...`);

  client = new Client({ name: "mcp-client", version: "1.0.0" });
  client.onerror = (err) => console.error("  Client error:", err.message);

  transport = createHttpTransport(url);
  await client.connect(transport);

  displayConnected("Streamable HTTP", client.getServerVersion());
}

async function connectStdio(serverScript) {
  console.log(`\n  Spawning stdio server: ${serverScript}...`);

  client = new Client({ name: "mcp-client", version: "1.0.0" });
  client.onerror = (err) => console.error("  Client error:", err.message);

  transport = createStdioTransport(serverScript);
  await client.connect(transport);

  displayConnected("stdio", client.getServerVersion());
}

async function discoverTools() {
  try {
    const result = await client.request(
      { method: "tools/list", params: {} },
      ListToolsResultSchema,
    );
    availableTools = result.tools || [];
    console.log(`  Found ${availableTools.length} tool(s).\n`);
  } catch (err) {
    console.log("  Could not list tools:", err.message);
    availableTools = [];
  }
}

// ── Input Handling ───────────────────────────────────────────

async function handleInput(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    prompt();
    return;
  }

  const routed = routeInput(trimmed, availableTools);

  // Handle special commands
  if (routed?.tool === "__quit") {
    await disconnect();
    return;
  }

  if (routed?.tool === "__list_tools") {
    displayTools(availableTools);
    prompt();
    return;
  }

  // No match
  if (!routed) {
    console.log("\n  🤔 Didn't understand. Try something like:");
    console.log('     "weather in Delhi"');
    console.log('     "forecast Mumbai"');
    console.log('     "aqi Bangalore"');
    console.log('     Type "help" for all commands.\n');
    prompt();
    return;
  }

  // Need city but none provided
  if (routed.needsCity) {
    console.log("\n  🏙️  Which city? Try:");
    console.log(`     "${routed.tool === "get_forecast" ? "forecast" : routed.tool === "get_aqi" ? "aqi" : "weather"} in Delhi"\n`);
    prompt();
    return;
  }

  // Call the tool
  try {
    console.log(`\n  ⏳ Calling ${routed.tool}(${JSON.stringify(routed.args)})...`);

    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: routed.tool,
          arguments: routed.args,
        },
      },
      CallToolResultSchema,
    );

    displayToolResult(result);
  } catch (err) {
    displayError(`Tool call failed: ${err.message}`);
  }

  prompt();
}

// ── Disconnect ───────────────────────────────────────────────

async function disconnect() {
  console.log("\n  Disconnecting...");
  try {
    if (transport) {
      await transport.close();
    }
  } catch (err) {
    // Ignore close errors
  }
  client = null;
  transport = null;
  rl.close();
  console.log("  👋 Bye!\n");
  process.exit(0);
}

// ── Transport Selection ──────────────────────────────────────

async function askTransport() {
  return new Promise((resolve) => {
    console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║         🔌 MCP Interactive Client                 ║
  ╠═══════════════════════════════════════════════════╣
  ║                                                   ║
  ║  Choose transport:                                ║
  ║    1. HTTP    — connect to running server         ║
  ║    2. stdio   — spawn server as subprocess        ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
    `);
    rl.question("  Enter 1 or 2: ", (answer) => {
      const choice = answer.trim();
      if (choice === "1") {
        rl.question("  Server URL [http://127.0.0.1:3000/mcp]: ", (url) => {
          resolve({
            type: "http",
            url: url.trim() || "http://127.0.0.1:3000/mcp",
          });
        });
      } else if (choice === "2") {
        rl.question("  Server script path: ", (script) => {
          resolve({
            type: "stdio",
            script: script.trim(),
          });
        });
      } else {
        console.log("  Invalid choice. Enter 1 or 2.");
        resolve(askTransport());
      }
    });
  });
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  // Check for CLI args
  const args = process.argv.slice(2);

  try {
    if (args[0] === "--http" && args[1]) {
      await connectHttp(args[1]);
    } else if (args[0] === "--stdio" && args[1]) {
      await connectStdio(args[1]);
    } else {
      // Interactive mode — ask which transport
      const choice = await askTransport();
      if (choice.type === "http") {
        await connectHttp(choice.url);
      } else {
        await connectStdio(choice.script);
      }
    }

    // Discover tools from the server
    await discoverTools();

    // Show help and start prompt loop
    displayHelp();
    prompt();
  } catch (err) {
    displayError(`Connection failed: ${err.message}`);
    console.log("  Make sure the server is running.\n");
    rl.close();
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", async () => {
  await disconnect();
});

main();

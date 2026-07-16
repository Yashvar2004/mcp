// ═══════════════════════════════════════════════════════════════
// MCP CLIENT — Official Pattern (LLM-Driven Tool Calling)
// ═══════════════════════════════════════════════════════════════
//
// This follows the official MCP client documentation:
//
// 1. Connect to MCP server, discover tools
// 2. User sends query
// 3. Query + tool schemas → LLM
// 4. LLM DECIDES which tools to call (not keyword matching!)
// 5. Execute tools via MCP
// 6. Results → LLM → natural language response
// 7. LLM can call multiple tools, chain them
// 8. Conversation history maintained for context
//
// ═══════════════════════════════════════════════════════════════

import "dotenv/config";
import { createInterface } from "node:readline";
import { initialize, listTools, callTool } from "./lib/mcp-raw.js";
import { processWithLLM } from "./lib/llm.js";
import { renderWidget } from "./lib/widgets.js";

// ── Config ───────────────────────────────────────────────────

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://127.0.0.1:3000/mcp";
const LLM_API_KEY = process.env.LLM_API_KEY;

if (!LLM_API_KEY || LLM_API_KEY === "sk-your-key-here") {
  console.error("\n  ❌ Set your LLM API key in .env file:");
  console.error("     Groq (FREE): LLM_API_KEY=gsk_xxxxxxxxxxxxxxxx");
  console.error("     DeepSeek: LLM_API_KEY=sk-xxxxxxxxxxxxxxxx\n");
  process.exit(1);
}

// ── State ────────────────────────────────────────────────────

let availableTools = [];
let conversationHistory = [];  // Maintains context between queries

// ── Readline ─────────────────────────────────────────────────

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("mcp> ", handleInput);
}

// ── Connect to Server ────────────────────────────────────────

async function connect() {
  console.log(`\n  Connecting to ${MCP_SERVER_URL}...`);

  const initResult = await initialize(MCP_SERVER_URL);
  console.log(`  ✅ Connected to: ${initResult.serverInfo.name} v${initResult.serverInfo.version}`);

  const toolsResult = await listTools(MCP_SERVER_URL);
  availableTools = toolsResult.tools || [];
  console.log(`  📋 Found ${availableTools.length} tools:`);
  for (const tool of availableTools) {
    console.log(`     🔧 ${tool.name} — ${tool.description}`);
  }
  console.log("");
}

// ── Execute MCP Tool (used by LLM) ──────────────────────────

async function executeTool(toolName, toolArgs) {
  return await callTool(MCP_SERVER_URL, toolName, toolArgs);
}

// ── Handle User Input ────────────────────────────────────────

async function handleInput(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    prompt();
    return;
  }

  // Special commands
  if (["quit", "exit", "q"].includes(trimmed.toLowerCase())) {
    console.log("\n  👋 Bye!\n");
    rl.close();
    process.exit(0);
  }

  if (["tools", "list"].includes(trimmed.toLowerCase())) {
    console.log("\n  Available tools:");
    for (const tool of availableTools) {
      console.log(`     🔧 ${tool.name} — ${tool.description}`);
    }
    console.log("");
    prompt();
    return;
  }

  if (["clear", "reset"].includes(trimmed.toLowerCase())) {
    conversationHistory = [];
    console.log("\n  🔄 Conversation cleared.\n");
    prompt();
    return;
  }

  // ── Official MCP Client Flow ─────────────────────────────
  //
  // 1. User query → LLM with tool schemas
  // 2. LLM decides tool calls
  // 3. Execute tools via MCP
  // 4. Results back to LLM
  // 5. LLM generates natural language response
  // 6. Repeat if LLM wants more tools
  //

  try {
    console.log("\n  🧠 Thinking...\n");

    const result = await processWithLLM(
      trimmed,
      availableTools,
      executeTool,
      LLM_API_KEY,
      conversationHistory,
    );

    // Update conversation history
    conversationHistory = result.updatedHistory;

    // Display widgets for each tool that was called
    if (result.toolResults && result.toolResults.length > 0) {
      for (const tr of result.toolResults) {
        console.log(`  🔍 Tool: ${tr.tool}(${JSON.stringify(tr.args)})`);
        const widget = renderWidget(tr.result);
        if (widget !== tr.result) {
          console.log(widget);
        } else {
          console.log("  (raw output — no widget match)");
          console.log(tr.result.substring(0, 200));
        }
      }
    } else {
      console.log("  (no tools were called by LLM)");
    }

    // Display LLM's natural language response
    console.log(`  ${result.response}\n`);

  } catch (err) {
    console.error(`  ❌ Error: ${err.message}\n`);
  }

  prompt();
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   🤖 MCP Client — LLM-Driven Tool Calling    ║
  ║   Official Pattern | No SDK | Groq/DeepSeek   ║
  ╠═══════════════════════════════════════════════╣
  ║                                               ║
  ║  The LLM decides which tools to call.         ║
  ║  Type natural language:                       ║
  ║    "weather in Delhi"                         ║
  ║    "gzb weather"                              ║
  ║    "delhi ka mausam kaisa hai"                ║
  ║    "compare delhi and mumbai weather"         ║
  ║                                               ║
  ║  Commands: tools, clear, quit                 ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);

  try {
    await connect();
    prompt();
  } catch (err) {
    console.error(`  ❌ Connection failed: ${err.message}`);
    console.error("  Make sure the MCP server is running.\n");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("\n  👋 Bye!\n");
  rl.close();
  process.exit(0);
});

main();

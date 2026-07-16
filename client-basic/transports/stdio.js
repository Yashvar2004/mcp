// ─────────────────────────────────────────────────────────────
// stdio Transport — spawns MCP server as subprocess
//
// The client spawns `node server.js` as a child process.
// Communication happens through stdin/stdout pipes.
//
// ┌──────────┐   stdin (JSON-RPC)   ┌──────────────┐
// │  Client   │ ──────────────────→ │  MCP Server  │
// │           │ ←────────────────── │  (subprocess)│
// └──────────┘   stdout (JSON-RPC)  └──────────────┘
// ─────────────────────────────────────────────────────────────

import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";

/**
 * Creates a stdio transport that spawns the given MCP server script.
 *
 * @param {string} serverScript - Absolute path to the server entry file
 * @returns {StdioClientTransport}
 */
export function createStdioTransport(serverScript) {
  const absolutePath = path.resolve(serverScript);

  return new StdioClientTransport({
    command: process.execPath,  // "node" executable
    args: [absolutePath],
    // Inherits safe env vars by default (PATH, HOME, etc.)
  });
}

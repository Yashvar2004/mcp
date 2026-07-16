// ─────────────────────────────────────────────────────────────
// HTTP Transport — connects to MCP server over Streamable HTTP
//
// Sends JSON-RPC as HTTP POST to the server's /mcp endpoint.
// Receives responses as HTTP responses (JSON or SSE stream).
//
// ┌──────────┐   POST /mcp (JSON-RPC)   ┌──────────────┐
// │  Client   │ ──────────────────────→  │  MCP Server  │
// │           │ ←──────────────────────  │  (port 3000) │
// └──────────┘   HTTP Response           └──────────────┘
// ─────────────────────────────────────────────────────────────

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Creates an HTTP transport connected to the given URL.
 *
 * @param {string} url - Server endpoint (e.g., "http://127.0.0.1:3000/mcp")
 * @returns {StreamableHTTPClientTransport}
 */
export function createHttpTransport(url) {
  return new StreamableHTTPClientTransport(new URL(url));
}

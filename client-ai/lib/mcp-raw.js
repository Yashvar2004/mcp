// ─────────────────────────────────────────────────────────────
// Raw MCP Protocol — NO SDK, just HTTP + JSON-RPC
//
// This is what the MCP SDK does under the hood.
// We're implementing it manually to understand the protocol.
//
// MCP uses JSON-RPC 2.0 format:
//   Request:  {"jsonrpc":"2.0","method":"...","params":{...},"id":1}
//   Response: {"jsonrpc":"2.0","result":{...},"id":1}
// ─────────────────────────────────────────────────────────────

let requestId = 0;

/**
 * Sends a raw JSON-RPC request to the MCP server via HTTP POST.
 *
 * @param {string} url - Server endpoint (e.g., "http://127.0.0.1:3000/mcp")
 * @param {string} method - MCP method (e.g., "tools/list", "tools/call")
 * @param {object} params - Method parameters
 * @returns {Promise<object>} - The result from the server
 */
export async function sendMcpRequest(url, method, params = {}) {
  requestId++;

  const body = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: requestId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`MCP server returned HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";

  // Server can respond with JSON or SSE (Server-Sent Events)
  if (contentType.includes("text/event-stream")) {
    return await parseSSE(response);
  } else {
    return await parseJSON(response);
  }
}

/**
 * Parse a JSON response.
 */
async function parseJSON(response) {
  const data = await response.json();

  if (data.error) {
    throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Parse an SSE response (Server-Sent Events).
 * SSE format:
 *   event: message
 *   data: {"jsonrpc":"2.0","result":{...},"id":1}
 */
async function parseSSE(response) {
  const text = await response.text();
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.slice(6).trim();
      if (jsonStr) {
        const data = JSON.parse(jsonStr);
        if (data.error) {
          throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
        }
        return data.result;
      }
    }
  }

  throw new Error("No valid data found in SSE response");
}

/**
 * Initialize the MCP session.
 * This is the first call — tells the server who we are.
 */
export async function initialize(url) {
  return await sendMcpRequest(url, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "mcp-client-ai",
      version: "1.0.0",
    },
  });
}

/**
 * List all available tools on the server.
 */
export async function listTools(url) {
  return await sendMcpRequest(url, "tools/list", {});
}

/**
 * Call a specific tool with arguments.
 */
export async function callTool(url, toolName, args) {
  return await sendMcpRequest(url, "tools/call", {
    name: toolName,
    arguments: args,
  });
}

// ─────────────────────────────────────────────────────────────
// HTTP entry point — Streamable HTTP transport
//
// Uses WebStandardStreamableHTTPServerTransport directly
// for full control over request/response handling.
// ─────────────────────────────────────────────────────────────

import http from "node:http";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "./server.js";
import { PORT, HOST, API_KEY } from "./config.js";

/**
 * Validates the Authorization header.
 * If MCP_API_KEY is set, requests must include: Authorization: Bearer <key>
 * If MCP_API_KEY is not set, all requests are allowed (development mode).
 *
 * @param {object} req - Node.js IncomingMessage
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAuth(req) {
  // No API key configured — allow all requests (development mode)
  if (!API_KEY) {
    return { valid: true };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header. Use: Authorization: Bearer <api_key>" };
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return { valid: false, error: "Invalid Authorization format. Use: Bearer <api_key>" };
  }

  if (token !== API_KEY) {
    return { valid: false, error: "Invalid API key" };
  }

  return { valid: true };
}

/**
 * Converts a Node.js IncomingMessage to a Web Standard Request,
 * with automatic Accept header normalization for MCP compatibility.
 */
function nodeRequestToWebRequest(nodeReq, body) {
  const url = `http://${nodeReq.headers.host || `${HOST}:${PORT}`}${nodeReq.url}`;

  // Copy headers and normalize Accept for MCP clients
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  // Ensure Accept header includes both required types
  const accept = headers.get("accept") || "";
  if (!accept.includes("application/json") || !accept.includes("text/event-stream")) {
    headers.set("accept", "application/json, text/event-stream");
  }

  const init = {
    method: nodeReq.method,
    headers,
  };

  // Attach body for POST/PUT/PATCH requests
  if (body && nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
    init.body = body;
  }

  return new Request(url, init);
}

/**
 * Reads the full request body as a string.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Converts a Web Standard Response to a Node.js ServerResponse.
 */
async function sendWebResponse(webRes, nodeRes) {
  // Set status and headers
  nodeRes.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));

  if (!webRes.body) {
    nodeRes.end();
    return;
  }

  // Stream the response body
  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      nodeRes.write(value);
    }
  } finally {
    reader.releaseLock();
    nodeRes.end();
  }
}

/**
 * Handles a single HTTP request with a fresh server + transport pair.
 */
async function handleRequest(req, res) {
  // Only serve /mcp
  if (req.url !== "/mcp") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /mcp" }));
    return;
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Reject unsupported methods
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Authorization check
  const auth = validateAuth(req);
  if (!auth.valid) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: auth.error }));
    return;
  }

  try {
    // Read body for POST/DELETE requests
    let body = null;
    if (req.method === "POST" || req.method === "DELETE") {
      body = await readBody(req);
    }

    // Convert Node.js request to Web Standard Request
    const webReq = nodeRequestToWebRequest(req, body);

    // Create fresh server + transport (stateless)
    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    // Handle the request using Web Standard APIs
    const webRes = await transport.handleRequest(webReq);

    // Send the Web Standard Response back through Node.js
    await sendWebResponse(webRes, res);
  } catch (error) {
    console.error("[http] Error handling request:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}

// ── Start the HTTP server ─────────────────────────────────────
const httpServer = http.createServer(handleRequest);

httpServer.listen(PORT, HOST, () => {
  console.log(`\n🌤️  India Weather & AQI MCP Server`);
  console.log(`   Endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`   Transport: Streamable HTTP (stateless)`);
  console.log(`   Tools: search_weather, get_forecast, get_aqi, get_full_report`);
  console.log(`   Auth: ${API_KEY ? "Enabled (Bearer token required)" : "Disabled (set MCP_API_KEY to enable)"}\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[server] Shutting down...");
  httpServer.close(() => process.exit(0));
});

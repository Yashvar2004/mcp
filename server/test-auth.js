// ─────────────────────────────────────────────────────────────
// Test Script — Test different OAuth providers
//
// Usage:
//   node test-auth.js bearer
//   node test-auth.js auth0
//   node test-auth.js supabase
//   node test-auth.js betterauth
// ─────────────────────────────────────────────────────────────

const SERVER_URL = "http://127.0.0.1:3000/mcp";

/**
 * Send a request to the MCP server
 */
async function sendRequest(token = null) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
      id: 1,
    }),
  });

  const text = await response.text();

  // Try to parse as JSON, or extract from SSE
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // SSE format: extract data from "data: {...}" line
    const match = text.match(/data: ({.*})/s);
    if (match) {
      data = JSON.parse(match[1]);
    } else {
      data = { raw: text.substring(0, 100) };
    }
  }

  return {
    status: response.status,
    data,
  };
}

/**
 * Test Bearer token auth
 */
async function testBearer() {
  console.log("\n🔑 Testing Bearer Token Auth");
  console.log("=".repeat(40));

  const key = process.env.MCP_API_KEY || "my-secret-key";

  console.log(`\n1. Without token:`);
  const result1 = await sendRequest();
  console.log(`   Status: ${result1.status}`);
  console.log(`   Response: ${JSON.stringify(result1.data)}`);

  console.log(`\n2. With wrong token:`);
  const result2 = await sendRequest("wrong-key");
  console.log(`   Status: ${result2.status}`);
  console.log(`   Response: ${JSON.stringify(result2.data)}`);

  console.log(`\n3. With correct token (${key}):`);
  const result3 = await sendRequest(key);
  console.log(`   Status: ${result3.status}`);
  console.log(`   Response: ${JSON.stringify(result3.data).substring(0, 100)}...`);
}

/**
 * Test Auth0 auth
 */
async function testAuth0() {
  console.log("\n🔐 Testing Auth0 OAuth");
  console.log("=".repeat(40));

  console.log(`\nAuth0 Configuration:`);
  console.log(`   Domain: ${process.env.AUTH0_DOMAIN || "(not set)"}`);
  console.log(`   Audience: ${process.env.AUTH0_AUDIENCE || "(not set)"}`);

  if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
    console.log(`\n⚠️  Auth0 not configured. Set AUTH0_DOMAIN and AUTH0_AUDIENCE`);
    console.log(`\n   To test Auth0:`);
    console.log(`   1. Create Auth0 account: https://auth0.com`);
    console.log(`   2. Create API in Auth0 dashboard`);
    console.log(`   3. Get domain and audience`);
    console.log(`   4. Set environment variables`);
    console.log(`   5. Get access token from Auth0`);
    return;
  }

  console.log(`\n1. Without token:`);
  const result1 = await sendRequest();
  console.log(`   Status: ${result1.status}`);
  console.log(`   Response: ${JSON.stringify(result1.data)}`);

  console.log(`\n2. With invalid token:`);
  const result2 = await sendRequest("invalid-auth0-token");
  console.log(`   Status: ${result2.status}`);
  console.log(`   Response: ${JSON.stringify(result2.data)}`);

  console.log(`\n3. With valid Auth0 token:`);
  console.log(`   (You need to get a real token from Auth0)`);
  console.log(`   Use: AUTH0_DOMAIN=xxx AUTH0_AUDIENCE=xxx node test-auth.js auth0`);
}

/**
 * Test Supabase auth
 */
async function testSupabase() {
  console.log("\n🟢 Testing Supabase OAuth");
  console.log("=".repeat(40));

  console.log(`\nSupabase Configuration:`);
  console.log(`   URL: ${process.env.SUPABASE_URL || "(not set)"}`);
  console.log(`   JWT Secret: ${process.env.SUPABASE_JWT_SECRET ? "***" : "(not set)"}`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_JWT_SECRET) {
    console.log(`\n⚠️  Supabase not configured. Set SUPABASE_URL and SUPABASE_JWT_SECRET`);
    console.log(`\n   To test Supabase:`);
    console.log(`   1. Create Supabase project: https://supabase.com`);
    console.log(`   2. Go to Settings > API`);
    console.log(`   3. Copy URL and JWT Secret`);
    console.log(`   4. Set environment variables`);
    console.log(`   5. Get access token from Supabase`);
    return;
  }

  console.log(`\n1. Without token:`);
  const result1 = await sendRequest();
  console.log(`   Status: ${result1.status}`);
  console.log(`   Response: ${JSON.stringify(result1.data)}`);

  console.log(`\n2. With invalid token:`);
  const result2 = await sendRequest("invalid-supabase-token");
  console.log(`   Status: ${result2.status}`);
  console.log(`   Response: ${JSON.stringify(result2.data)}`);

  console.log(`\n3. With valid Supabase token:`);
  console.log(`   (You need to get a real token from Supabase)`);
  console.log(`   Use: SUPABASE_URL=xxx SUPABASE_JWT_SECRET=xxx node test-auth.js supabase`);
}

/**
 * Test BetterAuth auth
 */
async function testBetterAuth() {
  console.log("\n🔵 Testing BetterAuth OAuth");
  console.log("=".repeat(40));

  console.log(`\nBetterAuth Configuration:`);
  console.log(`   URL: ${process.env.BETTER_AUTH_URL || "(not set)"}`);
  console.log(`   Secret: ${process.env.BETTER_AUTH_SECRET ? "***" : "(not set)"}`);

  if (!process.env.BETTER_AUTH_URL || !process.env.BETTER_AUTH_SECRET) {
    console.log(`\n⚠️  BetterAuth not configured. Set BETTER_AUTH_URL and BETTER_AUTH_SECRET`);
    console.log(`\n   To test BetterAuth:`);
    console.log(`   1. Set up BetterAuth server`);
    console.log(`   2. Get URL and secret`);
    console.log(`   3. Set environment variables`);
    console.log(`   4. Get session token from BetterAuth`);
    return;
  }

  console.log(`\n1. Without token:`);
  const result1 = await sendRequest();
  console.log(`   Status: ${result1.status}`);
  console.log(`   Response: ${JSON.stringify(result1.data)}`);

  console.log(`\n2. With invalid token:`);
  const result2 = await sendRequest("invalid-betterauth-token");
  console.log(`   Status: ${result2.status}`);
  console.log(`   Response: ${JSON.stringify(result2.data)}`);

  console.log(`\n3. With valid BetterAuth token:`);
  console.log(`   (You need to get a real token from BetterAuth)`);
  console.log(`   Use: BETTER_AUTH_URL=xxx BETTER_AUTH_SECRET=xxx node test-auth.js betterauth`);
}

// Main
const provider = process.argv[2] || "bearer";

console.log(`\n🧪 MCP Auth Test — Provider: ${provider}`);

switch (provider) {
  case "bearer":
    await testBearer();
    break;
  case "auth0":
    await testAuth0();
    break;
  case "supabase":
    await testSupabase();
    break;
  case "betterauth":
    await testBetterAuth();
    break;
  default:
    console.log(`\n❌ Unknown provider: ${provider}`);
    console.log(`\nUsage: node test-auth.js [bearer|auth0|supabase|betterauth]`);
}

console.log("");

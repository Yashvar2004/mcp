// ─────────────────────────────────────────────────────────────
// Auth Module — Unified OAuth Validation
//
// Supports multiple OAuth providers:
//   - Bearer Token (simple API key)
//   - Auth0 (JWT validation)
//   - Supabase (JWT validation)
//   - BetterAuth (session validation)
//
// Environment Variables:
//   MCP_API_KEY         - Simple bearer token (if using basic auth)
//   AUTH_PROVIDER       - Which provider to use: "bearer", "auth0", "supabase", "betterauth"
//   AUTH0_DOMAIN        - Auth0 domain
//   AUTH0_AUDIENCE      - Auth0 API audience
//   SUPABASE_URL        - Supabase project URL
//   SUPABASE_JWT_SECRET - Supabase JWT secret
//   BETTER_AUTH_URL     - BetterAuth server URL
//   BETTER_AUTH_SECRET  - BetterAuth secret
// ─────────────────────────────────────────────────────────────

import { validateAuth0Token, isAuth0Configured, getAuth0Info } from "./auth0.js";
import { validateSupabaseToken, isSupabaseConfigured, getSupabaseInfo } from "./supabase.js";
import { validateBetterAuthToken, isBetterAuthConfigured, getBetterAuthInfo } from "./betterauth.js";

// Configuration
const MCP_API_KEY = process.env.MCP_API_KEY;
const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "bearer";

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(authHeader) {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * Validate request authorization
 *
 * @param {object} req - HTTP request object
 * @returns {Promise<{valid: boolean, error?: string, provider?: string}>}
 */
export async function validateAuth(req) {
  const authHeader = req.headers.authorization;

  // No auth configured = allow all (development mode)
  if (!MCP_API_KEY && !isAuth0Configured() && !isSupabaseConfigured() && !isBetterAuthConfigured()) {
    return { valid: true, provider: "none" };
  }

  // Extract token
  const token = extractToken(authHeader);
  if (!token) {
    return {
      valid: false,
      error: "Missing Authorization header. Use: Authorization: Bearer <token>",
    };
  }

  // Validate based on provider
  switch (AUTH_PROVIDER) {
    case "bearer":
      return validateBearerToken(token);

    case "auth0":
      return await validateAuth0Provider(token);

    case "supabase":
      return await validateSupabaseProvider(token);

    case "betterauth":
      return await validateBetterAuthProvider(token);

    default:
      return { valid: false, error: `Unknown auth provider: ${AUTH_PROVIDER}` };
  }
}

/**
 * Validate simple Bearer token (API key)
 */
function validateBearerToken(token) {
  if (!MCP_API_KEY) {
    return { valid: false, error: "MCP_API_KEY not configured" };
  }

  if (token !== MCP_API_KEY) {
    return { valid: false, error: "Invalid API key" };
  }

  return { valid: true, provider: "bearer" };
}

/**
 * Validate Auth0 token
 */
async function validateAuth0Provider(token) {
  if (!isAuth0Configured()) {
    return { valid: false, error: "Auth0 not configured. Set AUTH0_DOMAIN and AUTH0_AUDIENCE" };
  }

  const result = await validateAuth0Token(token);
  return { ...result, provider: "auth0" };
}

/**
 * Validate Supabase token
 */
async function validateSupabaseProvider(token) {
  if (!isSupabaseConfigured()) {
    return { valid: false, error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_JWT_SECRET" };
  }

  const result = await validateSupabaseToken(token);
  return { ...result, provider: "supabase" };
}

/**
 * Validate BetterAuth token
 */
async function validateBetterAuthProvider(token) {
  if (!isBetterAuthConfigured()) {
    return { valid: false, error: "BetterAuth not configured. Set BETTER_AUTH_URL and BETTER_AUTH_SECRET" };
  }

  const result = await validateBetterAuthToken(token);
  return { ...result, provider: "betterauth" };
}

/**
 * Get current auth configuration info
 */
export function getAuthInfo() {
  return {
    provider: AUTH_PROVIDER,
    configured: isConfigured(),
    providers: {
      bearer: { configured: !!MCP_API_KEY },
      auth0: getAuth0Info(),
      supabase: getSupabaseInfo(),
      betterauth: getBetterAuthInfo(),
    },
  };
}

/**
 * Check if any auth is configured
 */
export function isConfigured() {
  return !!(MCP_API_KEY || isAuth0Configured() || isSupabaseConfigured() || isBetterAuthConfigured());
}

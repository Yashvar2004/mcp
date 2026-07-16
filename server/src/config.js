// ─────────────────────────────────────────────────────────────
// Configuration — central place for all server settings
// ─────────────────────────────────────────────────────────────

/** Port the HTTP server listens on */
export const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;

/** Host to bind to — 127.0.0.1 for security (prevents remote access) */
export const HOST = process.env.MCP_HOST || "127.0.0.1";

/** Open-Meteo API base URLs (no API key needed) */
export const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
export const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";
export const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1";

/**
 * MCP API Key for authorization.
 * Set MCP_API_KEY env var to enable authentication.
 * If not set, server runs without auth (for development).
 *
 * Clients must send: Authorization: Bearer <MCP_API_KEY>
 */
export const API_KEY = process.env.MCP_API_KEY || null;

// ─────────────────────────────────────────────────────────────
// BetterAuth OAuth Validation
//
// Validates session tokens issued by BetterAuth.
// Uses BetterAuth's API to verify sessions.
//
// Environment Variables:
//   BETTER_AUTH_URL  - Your BetterAuth server URL
//   BETTER_AUTH_SECRET - Your BetterAuth secret key
// ─────────────────────────────────────────────────────────────

// BetterAuth configuration
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

/**
 * Validate a BetterAuth session token
 *
 * @param {string} token - The session token to validate
 * @returns {Promise<{valid: boolean, payload?: object, error?: string}>}
 */
export async function validateBetterAuthToken(token) {
  // Check if BetterAuth is configured
  if (!BETTER_AUTH_URL || !BETTER_AUTH_SECRET) {
    return { valid: false, error: "BetterAuth not configured. Set BETTER_AUTH_URL and BETTER_AUTH_SECRET" };
  }

  try {
    // Call BetterAuth's session verification endpoint
    const response = await fetch(`${BETTER_AUTH_URL}/api/auth/verify-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BETTER_AUTH_SECRET}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { valid: false, error: `BetterAuth session invalid: ${error.message || response.statusText}` };
    }

    const data = await response.json();
    return { valid: true, payload: data };
  } catch (err) {
    return { valid: false, error: `BetterAuth verification failed: ${err.message}` };
  }
}

/**
 * Check if BetterAuth is configured
 */
export function isBetterAuthConfigured() {
  return !!(BETTER_AUTH_URL && BETTER_AUTH_SECRET);
}

/**
 * Get BetterAuth configuration info (for display)
 */
export function getBetterAuthInfo() {
  return {
    provider: "BetterAuth",
    url: BETTER_AUTH_URL || "(not set)",
    secret: BETTER_AUTH_SECRET ? "***" : "(not set)",
    configured: isBetterAuthConfigured(),
  };
}

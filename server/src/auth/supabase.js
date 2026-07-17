// ─────────────────────────────────────────────────────────────
// Supabase OAuth Validation
//
// Validates JWT tokens issued by Supabase.
// Uses Supabase's JWKS endpoint to verify tokens.
//
// Environment Variables:
//   SUPABASE_URL        - Your Supabase project URL
//   SUPABASE_JWT_SECRET - Your Supabase JWT secret (legacy, for HS256)
// ─────────────────────────────────────────────────────────────

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// JWKS client for Supabase
let client = null;

function getJwksClient() {
  if (!client && SUPABASE_URL) {
    client = jwksClient({
      jwksUri: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }
  return client;
}

/**
 * Get the signing key from Supabase's JWKS endpoint
 */
function getSigningKey(header, callback) {
  const jwks = getJwksClient();
  if (!jwks) {
    return callback(new Error("Supabase not configured"));
  }

  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Validate a Supabase JWT token
 *
 * @param {string} token - The JWT token to validate
 * @returns {Promise<{valid: boolean, payload?: object, error?: string}>}
 */
export function validateSupabaseToken(token) {
  return new Promise((resolve) => {
    // Check if Supabase is configured
    if (!SUPABASE_URL) {
      resolve({ valid: false, error: "Supabase not configured. Set SUPABASE_URL" });
      return;
    }

    // First try JWKS validation (for new Supabase projects with ECDSA)
    const jwks = getJwksClient();
    if (jwks) {
      jwt.verify(
        token,
        getSigningKey,
        {
          algorithms: ["ES256", "HS256"],
        },
        (err, decoded) => {
          if (err) {
            // JWKS failed, try legacy JWT secret
            if (SUPABASE_JWT_SECRET) {
              try {
                const secret = Buffer.from(SUPABASE_JWT_SECRET, "base64");
                decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
                resolve({ valid: true, payload: decoded });
                return;
              } catch (legacyErr) {
                resolve({ valid: false, error: `Supabase token invalid: ${legacyErr.message}` });
                return;
              }
            }
            resolve({ valid: false, error: `Supabase token invalid: ${err.message}` });
            return;
          }
          resolve({ valid: true, payload: decoded });
        }
      );
    } else {
      // No JWKS, try legacy JWT secret
      if (!SUPABASE_JWT_SECRET) {
        resolve({ valid: false, error: "Supabase not configured. Set SUPABASE_URL or SUPABASE_JWT_SECRET" });
        return;
      }

      try {
        const secret = Buffer.from(SUPABASE_JWT_SECRET, "base64");
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
        resolve({ valid: true, payload: decoded });
      } catch (err) {
        resolve({ valid: false, error: `Supabase token invalid: ${err.message}` });
      }
    }
  });
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL || SUPABASE_JWT_SECRET);
}

/**
 * Get Supabase configuration info (for display)
 */
export function getSupabaseInfo() {
  return {
    provider: "Supabase",
    url: SUPABASE_URL || "(not set)",
    jwtSecret: SUPABASE_JWT_SECRET ? "***" : "(not set)",
    configured: isSupabaseConfigured(),
  };
}

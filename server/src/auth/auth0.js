// ─────────────────────────────────────────────────────────────
// Auth0 OAuth Validation
//
// Validates JWT tokens issued by Auth0.
// Uses Auth0's JWKS (JSON Web Key Set) endpoint to verify tokens.
//
// Environment Variables:
//   AUTH0_DOMAIN    - Your Auth0 domain (e.g., dev-abc123.us.auth0.com)
//   AUTH0_AUDIENCE  - Your Auth0 API audience/identifier
// ─────────────────────────────────────────────────────────────

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

// JWKS client to fetch Auth0's public keys
let client = null;

function getJwksClient() {
  if (!client && AUTH0_DOMAIN) {
    client = jwksClient({
      jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }
  return client;
}

/**
 * Get the signing key from Auth0's JWKS endpoint
 */
function getSigningKey(header, callback) {
  const jwks = getJwksClient();
  if (!jwks) {
    return callback(new Error("Auth0 not configured"));
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
 * Validate an Auth0 JWT token
 *
 * @param {string} token - The JWT token to validate
 * @returns {Promise<{valid: boolean, payload?: object, error?: string}>}
 */
export function validateAuth0Token(token) {
  return new Promise((resolve) => {
    // Check if Auth0 is configured
    if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
      resolve({ valid: false, error: "Auth0 not configured. Set AUTH0_DOMAIN and AUTH0_AUDIENCE" });
      return;
    }

    // Verify the token
    jwt.verify(
      token,
      getSigningKey,
      {
        audience: AUTH0_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) {
          resolve({ valid: false, error: `Auth0 token invalid: ${err.message}` });
          return;
        }

        resolve({ valid: true, payload: decoded });
      }
    );
  });
}

/**
 * Check if Auth0 is configured
 */
export function isAuth0Configured() {
  return !!(AUTH0_DOMAIN && AUTH0_AUDIENCE);
}

/**
 * Get Auth0 configuration info (for display)
 */
export function getAuth0Info() {
  return {
    provider: "Auth0",
    domain: AUTH0_DOMAIN || "(not set)",
    audience: AUTH0_AUDIENCE || "(not set)",
    configured: isAuth0Configured(),
  };
}

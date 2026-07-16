// ─────────────────────────────────────────────────────────────
// API helper — shared HTTP request wrapper for Open-Meteo APIs
// ─────────────────────────────────────────────────────────────

/**
 * Makes a GET request and returns parsed JSON, or null on failure.
 * @param {string} url - The URL to fetch
 * @returns {Promise<object|null>}
 */
export async function makeRequest(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[api] Request failed:", error.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Geocoding — converts city names to lat/lon coordinates
// Uses Open-Meteo's free geocoding API (no API key needed)
// ─────────────────────────────────────────────────────────────

import { GEOCODING_BASE } from "../config.js";
import { makeRequest } from "./api.js";

/**
 * Resolves a city name to geocoding data (lat, lon, name, country, etc.)
 * @param {string} city - City name (e.g., "Delhi", "Mumbai", "New York")
 * @returns {Promise<{latitude: number, longitude: number, name: string, country: string, admin1: string}|null>}
 */
export async function geocodeCity(city) {
  const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const data = await makeRequest(url);

  if (!data || !data.results || data.results.length === 0) {
    return null;
  }

  return data.results[0];
}

// ─────────────────────────────────────────────────────────────
// Constants — weather code mappings and AQI level definitions
// ─────────────────────────────────────────────────────────────

/** Maps Open-Meteo weather codes to human-readable descriptions */
export const WEATHER_CODES = {
  0: "Clear sky ☀️",
  1: "Mainly clear 🌤️",
  2: "Partly cloudy ⛅",
  3: "Overcast ☁️",
  45: "Fog 🌫️",
  48: "Depositing rime fog 🌫️",
  51: "Light drizzle 🌧️",
  53: "Moderate drizzle 🌧️",
  55: "Dense drizzle 🌧️",
  61: "Slight rain 🌧️",
  63: "Moderate rain 🌧️",
  65: "Heavy rain 🌧️",
  71: "Slight snowfall 🌨️",
  73: "Moderate snowfall 🌨️",
  75: "Heavy snowfall 🌨️",
  80: "Slight rain showers 🌦️",
  81: "Moderate rain showers 🌦️",
  82: "Violent rain showers ⛈️",
  95: "Thunderstorm ⛈️",
  96: "Thunderstorm with slight hail ⛈️",
  99: "Thunderstorm with heavy hail ⛈️",
};

/**
 * Classifies a US AQI value into a level with emoji and color.
 * @param {number} aqi - The US AQI value
 * @returns {{ level: string, emoji: string, color: string }}
 */
export function getAQILevel(aqi) {
  if (aqi <= 50) return { level: "Good", emoji: "🟢", color: "Green" };
  if (aqi <= 100) return { level: "Moderate", emoji: "🟡", color: "Yellow" };
  if (aqi <= 150) return { level: "Unhealthy for Sensitive Groups", emoji: "🟠", color: "Orange" };
  if (aqi <= 200) return { level: "Unhealthy", emoji: "🔴", color: "Red" };
  if (aqi <= 300) return { level: "Very Unhealthy", emoji: "🟣", color: "Purple" };
  return { level: "Hazardous", emoji: "🟤", color: "Maroon" };
}

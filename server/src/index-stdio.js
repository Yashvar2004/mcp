// ─────────────────────────────────────────────────────────────
// Legacy stdio transport entry point (backward compatibility)
//
// This is the original server logic converted to ESM imports.
// Use this if you need stdio mode: node src/index-stdio.js
// ─────────────────────────────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

// Debug logging to file (doesn't interfere with stdio)
const logFile = path.join(process.env.APPDATA || process.env.HOME, "Claude", "mcp-debug.log");
function debugLog(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

debugLog("MCP Weather Server (stdio) starting...");
debugLog(`Node version: ${process.version}`);

const server = new McpServer({
  name: "india-weather-aqi",
  version: "2.0.0",
});

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";

async function makeRequest(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error making request:", error.message);
    return null;
  }
}

const WEATHER_CODES = {
  0: "Clear sky ☀️", 1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
  45: "Fog 🌫️", 48: "Depositing rime fog 🌫️", 51: "Light drizzle 🌧️", 53: "Moderate drizzle 🌧️",
  55: "Dense drizzle 🌧️", 61: "Slight rain 🌧️", 63: "Moderate rain 🌧️", 65: "Heavy rain 🌧️",
  71: "Slight snowfall 🌨️", 73: "Moderate snowfall 🌨️", 75: "Heavy snowfall 🌨️",
  80: "Slight rain showers 🌦️", 81: "Moderate rain showers 🌦️", 82: "Violent rain showers ⛈️",
  95: "Thunderstorm ⛈️", 96: "Thunderstorm with slight hail ⛈️", 99: "Thunderstorm with heavy hail ⛈️",
};

function getAQILevel(aqi) {
  if (aqi <= 50) return { level: "Good", emoji: "🟢", color: "Green" };
  if (aqi <= 100) return { level: "Moderate", emoji: "🟡", color: "Yellow" };
  if (aqi <= 150) return { level: "Unhealthy for Sensitive Groups", emoji: "🟠", color: "Orange" };
  if (aqi <= 200) return { level: "Unhealthy", emoji: "🔴", color: "Red" };
  if (aqi <= 300) return { level: "Very Unhealthy", emoji: "🟣", color: "Purple" };
  return { level: "Hazardous", emoji: "🟤", color: "Maroon" };
}

async function geocodeCity(city) {
  const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const data = await makeRequest(url);
  if (!data || !data.results || data.results.length === 0) return null;
  return data.results[0];
}

// ── Tools ─────────────────────────────────────────────────────

server.tool("search_weather", "Get current weather for any city", {
  city: z.string().describe("City name"),
}, async ({ city }) => {
  const location = await geocodeCity(city);
  if (!location) return { content: [{ type: "text", text: `❌ Could not find location: ${city}` }] };
  const { latitude, longitude, name, country, admin1 } = location;
  const data = await makeRequest(`${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index&timezone=auto`);
  if (!data || !data.current) return { content: [{ type: "text", text: "❌ Unable to fetch weather data." }] };
  const c = data.current;
  const loc = `${name}${admin1 ? ', ' + admin1 : ''}, ${country}`;
  const w = WEATHER_CODES[c.weather_code] || `Code ${c.weather_code}`;
  const result = { type: "weather", location: loc, temperature: c.temperature_2m, feelsLike: c.apparent_temperature, humidity: c.relative_humidity_2m, precipitation: c.precipitation, windSpeed: c.wind_speed_10m, windDirection: c.wind_direction_10m, pressure: c.pressure_msl, uvIndex: c.uv_index, condition: w };
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

server.tool("get_forecast", "Get 7-day weather forecast", {
  city: z.string().describe("City name"),
}, async ({ city }) => {
  const location = await geocodeCity(city);
  if (!location) return { content: [{ type: "text", text: `❌ Could not find location: ${city}` }] };
  const { latitude, longitude, name, country, admin1 } = location;
  const data = await makeRequest(`${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=auto&forecast_days=7`);
  if (!data || !data.daily) return { content: [{ type: "text", text: "❌ Unable to fetch forecast data." }] };
  const d = data.daily;
  const loc = `${name}${admin1 ? ', ' + admin1 : ''}, ${country}`;
  const days = [];
  for (let i = 0; i < d.time.length; i++) {
    days.push({ date: d.time[i], condition: WEATHER_CODES[d.weather_code[i]] || `Code ${d.weather_code[i]}`, tempMax: d.temperature_2m_max[i], tempMin: d.temperature_2m_min[i], precipitation: d.precipitation_sum[i], windSpeed: d.wind_speed_10m_max[i], uvIndex: d.uv_index_max[i] });
  }
  const result = { type: "forecast", location: loc, days };
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

server.tool("get_aqi", "Get Air Quality Index", {
  city: z.string().describe("City name"),
}, async ({ city }) => {
  const location = await geocodeCity(city);
  if (!location) return { content: [{ type: "text", text: `❌ Could not find location: ${city}` }] };
  const { latitude, longitude, name, country, admin1 } = location;
  const data = await makeRequest(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`);
  if (!data || !data.current) return { content: [{ type: "text", text: "❌ Unable to fetch AQI data." }] };
  const c = data.current;
  const loc = `${name}${admin1 ? ', ' + admin1 : ''}, ${country}`;
  const a = getAQILevel(c.us_aqi);
  const result = { type: "aqi", location: loc, aqi: c.us_aqi, level: a.level, emoji: a.emoji, pollutants: { pm25: { value: c.pm2_5, unit: "µg/m³" }, pm10: { value: c.pm10, unit: "µg/m³" }, ozone: { value: c.ozone, unit: "µg/m³" }, no2: { value: c.nitrogen_dioxide, unit: "µg/m³" }, so2: { value: c.sulphur_dioxide, unit: "µg/m³" }, co: { value: c.carbon_monoxide, unit: "µg/m³" } }, healthAdvice: c.us_aqi <= 50 ? "Air quality is good." : c.us_aqi <= 100 ? "Moderate. Sensitive people limit outdoor activity." : "Reduce outdoor exertion." };
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

server.tool("get_full_report", "Get complete weather + AQI report", {
  city: z.string().describe("City name"),
}, async ({ city }) => {
  const location = await geocodeCity(city);
  if (!location) return { content: [{ type: "text", text: `❌ Could not find location: ${city}` }] };
  const { latitude, longitude, name, country, admin1 } = location;
  const loc = `${name}${admin1 ? ', ' + admin1 : ''}, ${country}`;
  const [wd, ad] = await Promise.all([
    makeRequest(`${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`),
    makeRequest(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,ozone&timezone=auto`),
  ]);
  const result = { type: "fullReport", location: loc, weather: null, forecast: [], aqi: null };
  if (wd?.current) {
    result.weather = { temperature: wd.current.temperature_2m, feelsLike: wd.current.apparent_temperature, humidity: wd.current.relative_humidity_2m, precipitation: wd.current.precipitation, windSpeed: wd.current.wind_speed_10m, pressure: wd.current.pressure_msl, uvIndex: wd.current.uv_index, condition: WEATHER_CODES[wd.current.weather_code] || `Code ${wd.current.weather_code}` };
    if (wd.daily) {
      for (let i = 0; i < Math.min(3, wd.daily.time.length); i++) {
        result.forecast.push({ date: wd.daily.time[i], tempMax: wd.daily.temperature_2m_max[i], tempMin: wd.daily.temperature_2m_min[i], precipitation: wd.daily.precipitation_sum[i] });
      }
    }
  }
  if (ad?.current) {
    const a = getAQILevel(ad.current.us_aqi);
    result.aqi = { value: ad.current.us_aqi, level: a.level, emoji: a.emoji, pm25: ad.current.pm2_5, pm10: ad.current.pm10, ozone: ad.current.ozone };
  }
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

// ── Start stdio transport ─────────────────────────────────────
async function main() {
  debugLog("Creating StdioServerTransport...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  debugLog("MCP Server connected on stdio");
  console.error("India Weather & AQI MCP Server running on stdio");
}

main().catch((err) => {
  debugLog(`ERROR: ${err.message}`);
  console.error(err);
});

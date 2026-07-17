// ─────────────────────────────────────────────────────────────
// Weather tools — search_weather + get_forecast
// Registers both tools on a given McpServer instance.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { OPEN_METEO_BASE } from "../config.js";
import { makeRequest } from "../helpers/api.js";
import { geocodeCity } from "../helpers/geocoding.js";
import { WEATHER_CODES } from "../helpers/constants.js";

/**
 * Registers the search_weather and get_forecast tools.
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 */
export function registerWeatherTools(server) {
  // ── search_weather ──────────────────────────────────────────
  server.tool(
    "search_weather",
    "Get current weather for any city in India or worldwide by city name",
    {
      city: z.string().describe("City name (e.g., Delhi, Mumbai, Loni, Bangalore)"),
    },
    async ({ city }) => {
      const location = await geocodeCity(city);

      if (!location) {
        return {
          content: [{ type: "text", text: `❌ Could not find location: ${city}` }],
        };
      }

      const { latitude, longitude, name, country, admin1 } = location;
      const url = `${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index&timezone=auto`;

      const data = await makeRequest(url);

      if (!data || !data.current) {
        return {
          content: [{ type: "text", text: "❌ Unable to fetch weather data." }],
        };
      }

      const current = data.current;
      const locationName = `${name}${admin1 ? ", " + admin1 : ""}, ${country}`;
      const weatherDesc = WEATHER_CODES[current.weather_code] || `Code ${current.weather_code}`;

      // Return structured JSON for client widgets to render
      const result = {
        type: "weather",
        location: locationName,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        pressure: current.pressure_msl,
        uvIndex: current.uv_index,
        condition: weatherDesc,
        units: {
          temperature: "°C",
          humidity: "%",
          precipitation: "mm",
          windSpeed: "km/h",
          pressure: "hPa",
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        _meta: {
          ui: {
            resourceUri: "ui://weather/card",
          },
        },
      };
    }
  );

  // ── get_forecast ────────────────────────────────────────────
  server.tool(
    "get_forecast",
    "Get 7-day weather forecast for any city in India or worldwide",
    {
      city: z.string().describe("City name (e.g., Delhi, Mumbai, Loni)"),
    },
    async ({ city }) => {
      const location = await geocodeCity(city);

      if (!location) {
        return {
          content: [{ type: "text", text: `❌ Could not find location: ${city}` }],
        };
      }

      const { latitude, longitude, name, country, admin1 } = location;
      const url = `${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=auto&forecast_days=7`;

      const data = await makeRequest(url);

      if (!data || !data.daily) {
        return {
          content: [{ type: "text", text: "❌ Unable to fetch forecast data." }],
        };
      }

      const daily = data.daily;
      const locationName = `${name}${admin1 ? ", " + admin1 : ""}, ${country}`;

      // Return structured JSON for client widgets to render
      const days = [];
      for (let i = 0; i < daily.time.length; i++) {
        days.push({
          date: daily.time[i],
          condition: WEATHER_CODES[daily.weather_code[i]] || `Code ${daily.weather_code[i]}`,
          tempMax: daily.temperature_2m_max[i],
          tempMin: daily.temperature_2m_min[i],
          precipitation: daily.precipitation_sum[i],
          windSpeed: daily.wind_speed_10m_max[i],
          uvIndex: daily.uv_index_max[i],
        });
      }

      const result = {
        type: "forecast",
        location: locationName,
        days,
        units: {
          temperature: "°C",
          precipitation: "mm",
          windSpeed: "km/h",
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        _meta: {
          ui: {
            resourceUri: "ui://forecast/card",
          },
        },
      };
    }
  );
}

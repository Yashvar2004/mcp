// ─────────────────────────────────────────────────────────────
// Full report tool — get_full_report
// Combines current weather + 3-day forecast + AQI in one call.
// Uses registerAppTool from @modelcontextprotocol/ext-apps
// for spec-compliant MCP Apps UI linking.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { OPEN_METEO_BASE, AIR_QUALITY_BASE } from "../config.js";
import { makeRequest } from "../helpers/api.js";
import { geocodeCity } from "../helpers/geocoding.js";
import { WEATHER_CODES, getAQILevel } from "../helpers/constants.js";

/**
 * Registers the get_full_report tool.
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 * @param {Function} registerAppTool - registerAppTool from ext-apps
 */
export function registerFullReportTool(server, registerAppTool) {
  registerAppTool(
    server,
    "get_full_report",
    {
      description: "Get complete weather and air quality report for any city in India or worldwide",
      inputSchema: {
        city: z.string().describe("City name (e.g., Delhi, Mumbai, Loni)"),
      },
      _meta: {
        ui: {
          resourceUri: "ui://fullreport/card",
        },
      },
    },
    async ({ city }) => {
      const location = await geocodeCity(city);

      if (!location) {
        return {
          content: [{ type: "text", text: `Could not find location: ${city}` }],
          isError: true,
        };
      }

      const { latitude, longitude, name, country, admin1 } = location;
      const locationName = `${name}${admin1 ? ", " + admin1 : ""}, ${country}`;

      // Fetch weather and AQI in parallel for faster response
      const [weatherData, aqiData] = await Promise.all([
        makeRequest(
          `${OPEN_METEO_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`
        ),
        makeRequest(
          `${AIR_QUALITY_BASE}/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,ozone&timezone=auto`
        ),
      ]);

      const result = {
        type: "fullReport",
        location: locationName,
        weather: null,
        forecast: [],
        aqi: null,
      };

      // Weather section
      if (weatherData && weatherData.current) {
        const current = weatherData.current;
        const weatherDesc = WEATHER_CODES[current.weather_code] || `Code ${current.weather_code}`;

        result.weather = {
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          precipitation: current.precipitation,
          windSpeed: current.wind_speed_10m,
          pressure: current.pressure_msl,
          uvIndex: current.uv_index,
          condition: weatherDesc,
        };

        // 3-day forecast
        if (weatherData.daily) {
          for (let i = 0; i < Math.min(3, weatherData.daily.time.length); i++) {
            result.forecast.push({
              date: weatherData.daily.time[i],
              tempMax: weatherData.daily.temperature_2m_max[i],
              tempMin: weatherData.daily.temperature_2m_min[i],
              precipitation: weatherData.daily.precipitation_sum[i],
            });
          }
        }
      }

      // AQI section
      if (aqiData && aqiData.current) {
        const aqi = aqiData.current;
        const aqiInfo = getAQILevel(aqi.us_aqi);

        result.aqi = {
          value: aqi.us_aqi,
          level: aqiInfo.level,
          emoji: aqiInfo.emoji,
          pm25: aqi.pm2_5,
          pm10: aqi.pm10,
          ozone: aqi.ozone,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    }
  );
}

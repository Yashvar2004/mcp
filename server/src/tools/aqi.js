// ─────────────────────────────────────────────────────────────
// AQI tool — get_aqi
// Registers the air quality index tool on a given McpServer.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { AIR_QUALITY_BASE } from "../config.js";
import { makeRequest } from "../helpers/api.js";
import { geocodeCity } from "../helpers/geocoding.js";
import { getAQILevel } from "../helpers/constants.js";

/**
 * Registers the get_aqi tool.
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 */
export function registerAQITool(server) {
  server.tool(
    "get_aqi",
    "Get Air Quality Index (AQI) for any city in India or worldwide",
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
      const url = `${AIR_QUALITY_BASE}/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;

      const data = await makeRequest(url);

      if (!data || !data.current) {
        return {
          content: [{ type: "text", text: "❌ Unable to fetch AQI data." }],
        };
      }

      const current = data.current;
      const locationName = `${name}${admin1 ? ", " + admin1 : ""}, ${country}`;
      const aqiInfo = getAQILevel(current.us_aqi);

      // Return structured JSON for client widgets to render
      const result = {
        type: "aqi",
        location: locationName,
        aqi: current.us_aqi,
        level: aqiInfo.level,
        emoji: aqiInfo.emoji,
        pollutants: {
          pm25: { value: current.pm2_5, unit: "µg/m³" },
          pm10: { value: current.pm10, unit: "µg/m³" },
          ozone: { value: current.ozone, unit: "µg/m³" },
          no2: { value: current.nitrogen_dioxide, unit: "µg/m³" },
          so2: { value: current.sulphur_dioxide, unit: "µg/m³" },
          co: { value: current.carbon_monoxide, unit: "µg/m³" },
        },
        healthAdvice:
          current.us_aqi <= 50
            ? "Air quality is good. It's a great day for outdoor activities!"
            : current.us_aqi <= 100
            ? "Air quality is moderate. Unusually sensitive people should consider reducing prolonged outdoor exertion."
            : current.us_aqi <= 150
            ? "Sensitive groups should reduce prolonged outdoor exertion. General public is less likely to be affected."
            : "Everyone should reduce prolonged outdoor exertion. Stay indoors if possible.",
      };

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}

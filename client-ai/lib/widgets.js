// ─────────────────────────────────────────────────────────────
// Terminal Widgets — colored, structured output for terminal
//
// Receives STRUCTURED JSON from MCP server and renders
// beautiful terminal cards. No regex parsing needed!
//
// ═══════════════════════════════════════════════════════════
// FLOW:
//   Server → JSON string → JSON.parse() → Widget renders
//
// Example server response:
//   { type: "weather", location: "Delhi", temperature: 35, ... }
//
// Widget renders:
//   ┌──────────────────────────────┐
//   │ ☀️  Delhi                    │
//   │ 35°C  Clear Sky              │
//   │ 💧47%  💨7km/h               │
//   └──────────────────────────────┘
// ═══════════════════════════════════════════════════════════

// ── ANSI Color Codes ────────────────────────────────────────

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
  bgGray: "\x1b[100m",
};

// ── Helper Functions ────────────────────────────────────────

function pad(str, len) {
  return str + " ".repeat(Math.max(0, len - str.length));
}

function getWeatherIcon(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("mainly clear")) return "🌤️";
  if (c.includes("partly")) return "⛅";
  if (c.includes("overcast") || c.includes("cloud")) return "☁️";
  if (c.includes("fog")) return "🌫️";
  if (c.includes("drizzle")) return "🌧️";
  if (c.includes("rain") || c.includes("shower")) return "🌧️";
  if (c.includes("thunder")) return "⛈️";
  if (c.includes("snow")) return "🌨️";
  return "🌤️";
}

function getAQIColor(aqi) {
  const num = parseInt(aqi);
  if (num <= 50) return colors.bgGreen;
  if (num <= 100) return colors.bgYellow;
  if (num <= 150) return "\x1b[48;5;208m"; // orange
  if (num <= 200) return colors.bgRed;
  if (num <= 300) return colors.bgMagenta;
  return "\x1b[48;5;52m"; // dark red
}

function getBarColor(val, good, moderate) {
  if (!val || val <= good) return colors.green;
  if (val <= moderate) return colors.yellow;
  return colors.red;
}

// ── Weather Widget ──────────────────────────────────────────

export function weatherWidget(data) {
  const W = 44;
  const line = "─".repeat(W - 2);
  const icon = getWeatherIcon(data.condition);

  const rows = [
    "",
    `  ${colors.bold}┌${line}┐${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${icon}  ${colors.bold}${colors.cyan}${pad(data.location || "Unknown", W - 8)}${colors.reset}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}${" ".repeat(W - 2)}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${colors.bold}${colors.red}${data.temperature || "—"}°C${colors.reset}  ${colors.dim}Feels like ${data.feelsLike || "—"}°C${colors.reset}${" ".repeat(Math.max(0, W - 22 - String(data.temperature || "—").length - String(data.feelsLike || "—").length))}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${colors.dim}${data.condition || ""}${colors.reset}${" ".repeat(Math.max(0, W - 5 - (data.condition || "").length))}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}${" ".repeat(W - 2)}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${colors.blue}💧 ${pad(`Humidity: ${data.humidity || "—"}%`, 16)}${colors.reset}  ${colors.cyan}💨 ${pad(`Wind: ${data.windSpeed || "—"} km/h`, 16)}${colors.reset}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${colors.cyan}🌧️ ${pad(`Rain: ${data.precipitation || "0"} mm`, 16)}${colors.reset}  ${colors.yellow}☀️ ${pad(`UV: ${data.uvIndex || "—"}`, 16)}${colors.reset}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${colors.magenta}📊 ${pad(`Pressure: ${data.pressure || "—"} hPa`, 34)}${colors.reset}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}└${line}┘${colors.reset}`,
    "",
  ];

  return rows.join("\n");
}

// ── AQI Widget ──────────────────────────────────────────────

export function aqiWidget(data) {
  const W = 44;
  const line = "─".repeat(W - 2);
  const aqiColor = getAQIColor(data.aqi);

  function bar(name, value, good, moderate, unit) {
    const val = parseFloat(value) || 0;
    const max = moderate * 1.5;
    const filled = Math.min(Math.round((val / max) * 20), 20);
    const empty = 20 - filled;
    const barColor = getBarColor(val, good, moderate);
    return `  ${colors.bold}│${colors.reset}  ${colors.dim}${pad(name, 5)}${colors.reset} ${barColor}${"█".repeat(filled)}${colors.dim}${"░".repeat(empty)}${colors.reset} ${colors.bold}${pad(`${value || "—"} ${unit}`, 12)}${colors.reset}${colors.bold}│${colors.reset}`;
  }

  const rows = [
    "",
    `  ${colors.bold}┌${line}┐${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  🌬️  ${colors.bold}${colors.cyan}${pad(data.location || "Unknown", W - 8)}${colors.reset}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}${" ".repeat(W - 2)}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  ${aqiColor} ${colors.bold}${colors.white} AQI: ${pad(String(data.aqi || "—"), 4)} ${colors.reset}  ${colors.bold}${data.level || ""}${colors.reset}${" ".repeat(Math.max(0, W - 20 - (data.level || "").length))}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}│${colors.reset}${" ".repeat(W - 2)}${colors.bold}│${colors.reset}`,
    bar("PM2.5", data.pollutants?.pm25?.value, 25, 50, "µg/m³"),
    bar("PM10", data.pollutants?.pm10?.value, 50, 100, "µg/m³"),
    bar("O₃", data.pollutants?.ozone?.value, 100, 180, "µg/m³"),
    bar("NO₂", data.pollutants?.no2?.value, 40, 80, "µg/m³"),
    `  ${colors.bold}│${colors.reset}${" ".repeat(W - 2)}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}└${line}┘${colors.reset}`,
    "",
  ];

  // Add health advice if present
  if (data.healthAdvice) {
    rows.push(`  ${colors.dim}💡 ${data.healthAdvice}${colors.reset}`);
    rows.push("");
  }

  return rows.join("\n");
}

// ── Forecast Widget ─────────────────────────────────────────

export function forecastWidget(data) {
  const W = 44;
  const line = "─".repeat(W - 2);

  const rows = [
    "",
    `  ${colors.bold}┌${line}┐${colors.reset}`,
    `  ${colors.bold}│${colors.reset}  📅  ${colors.bold}${colors.cyan}${pad(`${data.location} — ${data.days?.length || 7}-Day Forecast`, W - 8)}${colors.reset}${colors.bold}│${colors.reset}`,
    `  ${colors.bold}├${line}┤${colors.reset}`,
  ];

  if (data.days) {
    for (const day of data.days.slice(0, 7)) {
      const icon = getWeatherIcon(day.condition);
      const date = new Date(day.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
      });
      const high = day.tempMax || "—";
      const low = day.tempMin || "—";
      const rain = day.precipitation || "—";

      rows.push(
        `  ${colors.bold}│${colors.reset}  ${colors.bold}${pad(date, 6)}${colors.reset}  ${icon}  ${colors.red}${high}°${colors.reset} / ${colors.blue}${low}°${colors.reset}  ${colors.dim}🌧️ ${rain}mm${colors.reset}${" ".repeat(Math.max(0, W - 36))}${colors.bold}│${colors.reset}`
      );
    }
  }

  rows.push(`  ${colors.bold}└${line}┘${colors.reset}`);
  rows.push("");

  return rows.join("\n");
}

// ── Full Report Widget ──────────────────────────────────────

export function fullReportWidget(data) {
  const W = 44;
  const line = "═".repeat(W - 2);

  const rows = [
    "",
    `  ${colors.bold}╔${line}╗${colors.reset}`,
    `  ${colors.bold}║${colors.reset}  🌤️  ${colors.bold}${colors.cyan}${pad("Complete Weather Report", W - 8)}${colors.reset}${colors.bold}║${colors.reset}`,
    `  ${colors.bold}║${colors.reset}  📍  ${colors.dim}${pad(data.location || "Unknown", W - 8)}${colors.reset}${colors.bold}║${colors.reset}`,
    `  ${colors.bold}╠${line}╣${colors.reset}`,
  ];

  // Weather section
  if (data.weather) {
    const w = data.weather;
    const icon = getWeatherIcon(w.condition);
    rows.push(`  ${colors.bold}║${colors.reset}  ${icon}  ${colors.bold}Current Weather${colors.reset}${" ".repeat(W - 20)}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}${" ".repeat(W - 2)}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  ${colors.red}${w.temperature || "—"}°C${colors.reset}  ${colors.dim}Feels like ${w.feelsLike || "—"}°C${colors.reset}${" ".repeat(Math.max(0, W - 24 - String(w.temperature || "").length - String(w.feelsLike || "").length))}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  ${colors.dim}${w.condition || ""}${colors.reset}${" ".repeat(Math.max(0, W - 5 - (w.condition || "").length))}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}${" ".repeat(W - 2)}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  ${colors.blue}💧 ${pad(`Humidity: ${w.humidity || "—"}%`, 16)}${colors.reset}  ${colors.cyan}💨 ${pad(`Wind: ${w.windSpeed || "—"} km/h`, 16)}${colors.reset}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  ${colors.yellow}☀️ ${pad(`UV: ${w.uvIndex || "—"}`, 16)}${colors.reset}  ${colors.magenta}📊 ${pad(`${w.pressure || "—"} hPa`, 16)}${colors.reset}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}${" ".repeat(W - 2)}${colors.bold}║${colors.reset}`);
  }

  // Forecast section
  if (data.forecast && data.forecast.length > 0) {
    rows.push(`  ${colors.bold}╟${"─".repeat(W - 2)}╢${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  📅  ${colors.bold}3-Day Forecast${colors.reset}${" ".repeat(W - 19)}${colors.bold}║${colors.reset}`);
    for (const day of data.forecast.slice(0, 3)) {
      const date = new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      rows.push(`  ${colors.bold}║${colors.reset}  ${colors.bold}${pad(date, 6)}${colors.reset}  ${colors.red}${day.tempMax || "—"}°${colors.reset} / ${colors.blue}${day.tempMin || "—"}°${colors.reset}  ${colors.dim}🌧️ ${day.precipitation || "—"}mm${colors.reset}${" ".repeat(Math.max(0, W - 36))}${colors.bold}║${colors.reset}`);
    }
    rows.push(`  ${colors.bold}║${colors.reset}${" ".repeat(W - 2)}${colors.bold}║${colors.reset}`);
  }

  // AQI section
  if (data.aqi) {
    const aqiColor = getAQIColor(data.aqi.value);
    rows.push(`  ${colors.bold}╟${"─".repeat(W - 2)}╢${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  🌬️  ${colors.bold}Air Quality${colors.reset}${" ".repeat(W - 16)}${colors.bold}║${colors.reset}`);
    rows.push(`  ${colors.bold}║${colors.reset}  ${aqiColor} ${colors.bold}${colors.white} AQI: ${pad(String(data.aqi.value || "—"), 4)} ${colors.reset}  ${colors.bold}${data.aqi.level || ""}${colors.reset}${" ".repeat(Math.max(0, W - 20 - (data.aqi.level || "").length))}${colors.bold}║${colors.reset}`);
    if (data.aqi.pm25 !== undefined) {
      rows.push(`  ${colors.bold}║${colors.reset}  ${colors.dim}PM2.5: ${data.aqi.pm25} | PM10: ${data.aqi.pm10} | O₃: ${data.aqi.ozone}${colors.reset}${" ".repeat(Math.max(0, W - 38))}${colors.bold}║${colors.reset}`);
    }
  }

  rows.push(`  ${colors.bold}╚${line}╝${colors.reset}`);
  rows.push("");

  return rows.join("\n");
}

// ── Auto-detect and render widget ───────────────────────────

export function renderWidget(text) {
  if (!text) return text;

  // Try to parse as JSON (structured data from server)
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // Not JSON — return as-is (plain text from LLM or old server)
    return text;
  }

  // Route to the right widget based on type field
  if (data.type === "weather") return weatherWidget(data);
  if (data.type === "aqi") return aqiWidget(data);
  if (data.type === "forecast") return forecastWidget(data);
  if (data.type === "fullReport") return fullReportWidget(data);

  // Unknown type — return formatted JSON
  return JSON.stringify(data, null, 2);
}

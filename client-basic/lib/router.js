// ─────────────────────────────────────────────────────────────
// Router — maps natural language input → MCP tool name + args
//
// Uses simple keyword matching. No LLM needed.
// Example: "weather in Delhi" → { tool: "search_weather", args: { city: "Delhi" } }
// ─────────────────────────────────────────────────────────────

/**
 * Tool definitions with trigger keywords and descriptions.
 * Used for both routing and help display.
 */
const TOOLS = [
  {
    name: "search_weather",
    keywords: ["weather", "temperature", "temp", "current", "now", "today"],
    description: "Get current weather",
    needsCity: true,
  },
  {
    name: "get_forecast",
    keywords: ["forecast", "week", "7 day", "seven day", "tomorrow", "next"],
    description: "Get 7-day forecast",
    needsCity: true,
  },
  {
    name: "get_aqi",
    keywords: ["aqi", "air quality", "pollution", "pollutant", "air"],
    description: "Get Air Quality Index",
    needsCity: true,
  },
  {
    name: "get_full_report",
    keywords: ["full", "report", "complete", "everything", "all", "detailed"],
    description: "Get complete weather + AQI report",
    needsCity: true,
  },
];

/**
 * Common city name patterns to extract from input.
 * Handles "weather in Delhi", "Delhi weather", "check Mumbai aqi", etc.
 */
function extractCity(input, matchedTool) {
  // Remove tool-matching keywords to isolate the city name
  let cleaned = input.toLowerCase();

  // Remove common filler words
  const fillers = [
    "weather", "temperature", "temp", "current", "now", "today",
    "forecast", "week", "7 day", "seven day", "tomorrow", "next",
    "aqi", "air quality", "pollution", "pollutant", "air",
    "full", "report", "complete", "everything", "all", "detailed",
    "in", "for", "of", "at", "the", "check", "get", "show", "me",
    "what", "is", "what's", "tell", "give", "find", "search",
  ];

  // Split into words and remove fillers
  const words = input.split(/\s+/).filter(word => {
    const lower = word.toLowerCase();
    return !fillers.includes(lower) && lower.length > 0;
  });

  // Join remaining words as city name
  const city = words.join(" ").trim();

  if (city.length > 0) {
    // Capitalize first letter of each word
    return city.replace(/\b\w/g, c => c.toUpperCase());
  }

  return null;
}

/**
 * Routes user input to an MCP tool.
 *
 * @param {string} input - User's natural language input
 * @param {Array} availableTools - Tools from the server (from tools/list)
 * @returns {{ tool: string, args: object, confidence: "high" | "low" } | null}
 */
export function routeInput(input, availableTools = []) {
  const lower = input.toLowerCase().trim();

  // Special command: list tools
  if (["tools", "list tools", "list-tools", "help", "?"].includes(lower)) {
    return { tool: "__list_tools", args: {}, confidence: "high" };
  }

  // Special command: quit
  if (["quit", "exit", "q", "bye"].includes(lower)) {
    return { tool: "__quit", args: {}, confidence: "high" };
  }

  // Find the best matching tool by keyword score
  let bestMatch = null;
  let bestScore = 0;

  for (const toolDef of TOOLS) {
    let score = 0;
    for (const keyword of toolDef.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // longer matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = toolDef;
    }
  }

  if (!bestMatch || bestScore === 0) {
    return null; // No match found
  }

  // Check if the server actually has this tool
  const serverHasTool = availableTools.length === 0 || availableTools.some(t => t.name === bestMatch.name);

  if (!serverHasTool) {
    return null;
  }

  // Extract city name
  const city = extractCity(input, bestMatch);

  if (!city) {
    return {
      tool: bestMatch.name,
      args: {},
      needsCity: true,
      confidence: "low",
    };
  }

  return {
    tool: bestMatch.name,
    args: { city },
    confidence: "high",
  };
}

/**
 * Returns descriptions of all available tools for help text.
 */
export function getToolDescriptions() {
  return TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    example: `e.g., "${t.keywords[0]} in Delhi"`,
  }));
}

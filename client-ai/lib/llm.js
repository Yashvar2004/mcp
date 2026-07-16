// ─────────────────────────────────────────────────────────────
// LLM Integration — Official MCP Client Pattern
//
// The LLM doesn't just classify intent — it DECIDES which
// tools to call, sees the results, and generates a natural
// language response. This matches the official MCP client spec.
//
// Flow:
//   1. User query + tool schemas → LLM
//   2. LLM says "call tool X with args Y"
//   3. We execute the tool via MCP
//   4. Result goes back to LLM
//   5. LLM generates final natural language response
//   6. If LLM wants more tools, repeat from step 2
// ─────────────────────────────────────────────────────────────

// Supports Groq (free) and DeepSeek — both OpenAI-compatible
const PROVIDERS = {
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
  },
};

function getProvider(apiKey) {
  if (apiKey.startsWith("gsk_")) return PROVIDERS.groq;
  return PROVIDERS.deepseek;
}

/**
 * Converts MCP tools to OpenAI function-calling format.
 * This is what the LLM needs to understand available tools.
 */
export function formatToolsForLLM(mcpTools) {
  return mcpTools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || { type: "object", properties: {} },
    },
  }));
}

/**
 * Processes a user query using the official MCP client pattern.
 *
 * @param {string} userQuery - What the user typed
 * @param {Array} mcpTools - Tools from MCP server (tools/list)
 * @param {Function} executeTool - Function to call MCP tools: (name, args) => result
 * @param {string} apiKey - LLM API key
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<{response: string, updatedHistory: Array}>}
 */
export async function processWithLLM(userQuery, mcpTools, executeTool, apiKey, conversationHistory = []) {
  const provider = getProvider(apiKey);
  const llmTools = formatToolsForLLM(mcpTools);

  // Build message history
  const messages = [
    {
      role: "system",
      content: `You are a helpful weather assistant. You have access to weather and air quality tools.
When the user asks about weather, forecast, air quality, or anything related — use the available tools.
Expand city abbreviations: gzb=Ghaziabad, del=Delhi, mum=Mumbai, blr=Bangalore, che=Chennai, kol=Kolkata, hyd=Hyderabad, pun=Pune, ahm=Ahmedabad, lko=Lucknow.
Understand Hinglish: "mausam"=weather, "hawa"=air, "kal"=tomorrow, "aaj"=today.
If no city is mentioned, ask which city.
Always respond in a friendly, conversational way.`,
    },
    ...conversationHistory,
    { role: "user", content: userQuery },
  ];

  // ── Step 1: Send query + tools to LLM ────────────────────
  let response = await callLLM(provider, apiKey, messages, llmTools);

  const finalText = [];
  const toolResults = [];  // Track raw tool outputs for widget rendering
  const updatedHistory = [...conversationHistory, { role: "user", content: userQuery }];

  // ── Step 2: Process LLM response — handle tool calls ─────
  //
  // The LLM might call multiple tools. We loop until it
  // stops calling tools and gives a final text response.
  //

  let maxIterations = 5; // Safety limit

  while (maxIterations > 0) {
    maxIterations--;

    const choice = response.choices[0];

    // Check if LLM wants to call tools
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      // Add assistant message (with tool calls) to history
      messages.push(choice.message);
      updatedHistory.push(choice.message);

      // Execute each tool call
      for (const toolCall of choice.message.tool_calls) {
        let toolName = toolCall.function.name;
        let toolArgs = {};

        // Fix: LLM sometimes puts args inside tool name like: search_weather {"city":"Delhi"}
        const nameMatch = toolName.match(/^(\w+)\s*(\{.*\})$/);
        if (nameMatch) {
          toolName = nameMatch[1];
          try { toolArgs = JSON.parse(nameMatch[2]); } catch (e) {}
        }

        try {
          toolArgs = Object.keys(toolArgs).length > 0 ? toolArgs : JSON.parse(toolCall.function.arguments);
        } catch (e) {
          const raw = toolCall.function.arguments || "{}";
          const match = raw.match(/\{[^}]*\}/);
          if (match) {
            try { toolArgs = JSON.parse(match[0]); } catch (e2) {}
          }
        }

        // Call the MCP tool — handle errors gracefully
        let resultText = "";
        try {
          const toolResult = await executeTool(toolName, toolArgs);
          if (toolResult?.content) {
            resultText = toolResult.content
              .filter(c => c.type === "text")
              .map(c => c.text)
              .join("\n");
          } else {
            resultText = JSON.stringify(toolResult);
          }
        } catch (err) {
          resultText = `Error calling tool ${toolName}: ${err.message}`;
        }

        // Capture raw tool result for widget rendering
        toolResults.push({ tool: toolName, args: toolArgs, result: resultText });

        // Add tool result to messages
        const toolMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText,
        };
        messages.push(toolMessage);
        updatedHistory.push(toolMessage);
      }

      // ── Step 3: Send tool results back to LLM ──────────
      response = await callLLM(provider, apiKey, messages, llmTools);

    } else {
      // No more tool calls — LLM gave final text response
      finalText.push(choice.message.content);
      updatedHistory.push({ role: "assistant", content: choice.message.content });
      break;
    }
  }

  return {
    response: finalText.join("\n"),
    toolResults,
    updatedHistory,
  };
}

/**
 * Calls the LLM API (Groq or DeepSeek).
 */
async function callLLM(provider, apiKey, messages, tools) {
  const body = {
    model: provider.model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1024,
  };

  // Only include tools if provided
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${err}`);
  }

  return await response.json();
}

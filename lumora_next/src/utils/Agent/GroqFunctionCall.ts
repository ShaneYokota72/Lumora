import { tools, ToolTag } from './tools';
import { EventData } from './types';
import { Groq } from 'groq-sdk';

require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ROUTING_MODEL = 'llama-3.3-70b-versatile';

function parseZoomData(data: EventData): string {
  if (data.messageType === 'TRANSCRIPT') {
    return `Conversation transcript from ${data.from} to ${(Array.isArray(data.to) ? data.to.join(', ') : data.to)}:\n${data.data}`;
  }
  const toRecipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;
  return `Chat message from ${data.from} to ${toRecipients}:\n"${data.data}"`;
}

async function routeQuery(eventData: EventData, enabledTools: ToolTag[]): Promise<ToolTag | "none"> {
  const prompt = parseZoomData(eventData);
  
  const enabledToolsPrompt = `Analyze the conversation and determine which tool is needed:
${enabledTools.map(tool => 
  `- Respond with "TOOL: ${tool.toUpperCase()}" if ${tools[tool].description}`
).join('\n')}
- Respond with "NO TOOL" if no specific action is needed or if the required tool is not enabled`;

  const response = await groq.chat.completions.create({
    model: ROUTING_MODEL,
    messages: [{
      role: "system",
      content: enabledToolsPrompt
    }, {
      role: "user",
      content: prompt
    }],
    max_tokens: 20
  });

  const decision = response.choices?.[0]?.message?.content?.trim() ?? '';
  
  for (const tool of enabledTools) {
    if (decision.includes(`TOOL: ${tool.toUpperCase()}`)) {
      return tool;
    }
  }
  return "none";
}

export async function processZoomEvent(eventData: EventData, enabledTools: ToolTag[]) {
  try {
    const route = await routeQuery(eventData, enabledTools);
    const prompt = parseZoomData(eventData);

    if (route === "none") {
      return {
        action: "no_action_needed",
        summary: "No actionable items detected"
      };
    }

    if (!enabledTools.includes(route)) {
      return {
        action: "tool_disabled",
        summary: `The ${route} tool is not enabled for this user`
      };
    }

    const tool = tools[route];
    
    try {
      const result = await tool.handler(prompt);
      
      return {
        action: "success",
        tag: route,
        user_email: eventData.messageType === 'CHAT' ? eventData.to : eventData.from,
        ...result
      };
    } catch (error) {
      return {
        action: "error",
        error: (error as Error).message,
        details: {
          route: route,
          prompt: prompt
        }
      };
    }
  } catch (error) {
    return {
      action: "error",
      error: "Failed to process request: " + (error as Error).message
    };
  }
}

// Example usage:
// const result = await processZoomEvent(eventData, ["meeting", "todo"]);
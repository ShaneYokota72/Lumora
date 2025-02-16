import { Tool } from '../Tool';
import { validatorFunctions } from '../validators';

import { Groq } from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface MeetingArgs {
  title: string;
  participants: string[];
  time: string;
  duration?: number;
  unsure?: boolean;
}

export const meetingTool = new Tool(
  "schedule_meeting",
  "Schedule a meeting with participants only if there is an explicit request to meet at a specific time",
  {
    type: "object",
    properties: {
      title: { 
        type: "string", 
        description: "Meeting title, derived from the context of the conversation" 
      },
      participants: { 
        type: "array", 
        items: { type: "string" },
        description: "Email addresses of participants"
      },
      time: { 
        type: "string", 
        description: "Proposed meeting time" 
      },
      duration: { 
        type: "number", 
        description: "Meeting duration in minutes",
        default: 30 
      },
      unsure: {
        type: "boolean",
        description: "Set to true if time is ambiguous",
        default: false
      }
    },
    required: ["title", "participants", "time"]
  },
  `You are a meeting scheduling assistant. Only schedule meetings when:
- There is an explicit request to meet
- A specific time is mentioned (e.g., "Wednesday at 2pm")
Do NOT schedule meetings for:
- General questions or discussions
- When time is ambiguous
- Status updates without meeting requests`,
  (args: MeetingArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.title), field: 'title' },
      { check: () => validatorFunctions.isArray(args.participants), field: 'participants' },
      { check: () => validatorFunctions.isString(args.time), field: 'time' }
    ];
    return checks.every(({ check }) => check());
  },
  async (args: MeetingArgs) => {
    const descriptionResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: "system",
        content: "Create a meeting description based on the provided meeting details."
      }, {
        role: "user",
        content: `Title: ${args.title}\nParticipants: ${args.participants.join(', ')}\nTime: ${args.time}`
      }],
      tools: [{
        type: "function",
        function: {
          name: "create_meeting_description",
          description: "Create a meeting description",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Meeting description detailing what was scheduled"
              }
            },
            required: ["description"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "create_meeting_description" } }
    });

    const description = JSON.parse(descriptionResponse.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{"description":""}').description;
    return { 
      status: "scheduled",
      desc: description
    };
  }
);
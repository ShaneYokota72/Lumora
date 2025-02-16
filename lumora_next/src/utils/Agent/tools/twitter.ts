import { Tool } from '../Tool';
import { validatorFunctions } from '../validators';

import { Groq } from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface TwitterArgs {
  tweetType: string;
  topic: string;
  keyPoints: string[];
  audience: string;
  urls?: string[];
  mentions?: string[];
}

export const twitterTool = new Tool(
  "create_tweet",
  "Create a tweet based on the conversation context",
  {
    type: "object",
    properties: {
      tweetType: {
        type: "string",
        enum: ["announcement", "update", "reminder", "milestone", "engagement"],
        description: "The type/purpose of the tweet"
      },
      topic: {
        type: "string",
        description: "Main topic or subject of the tweet"
      },
      keyPoints: {
        type: "array",
        items: { type: "string" },
        description: "Key information points to include in the tweet"
      },
      audience: {
        type: "string",
        enum: ["team", "clients", "public", "stakeholders"],
        description: "Target audience for the tweet"
      },
      urls: {
        type: "array",
        items: { type: "string" },
        description: "Any URLs to include in the tweet"
      },
      mentions: {
        type: "array",
        items: { type: "string" },
        description: "Twitter handles to mention"
      }
    },
    required: ["tweetType", "topic", "keyPoints", "audience"]
  },
  `You are a tweet creation assistant. Create tweets when:
- There is an explicit request to share on Twitter
- There is noteworthy news or updates to share
Determine tweet type based on:
- Announcement: New features, launches, major updates
- Milestone: Achievements, metrics, celebrations
- Update: Progress reports, minor changes
- Reminder: Upcoming events or deadlines
- Engagement: Community interaction, questions`,
  (args: TwitterArgs) => {
    const checks = [
      { check: () => validatorFunctions.isTweetType(args.tweetType), field: 'tweetType' },
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isArray(args.keyPoints), field: 'keyPoints' },
      { check: () => validatorFunctions.isAudience(args.audience), field: 'audience' },
      { check: () => validatorFunctions.isOptionalArray(args.urls), field: 'urls' },
      { check: () => validatorFunctions.isOptionalArray(args.mentions), field: 'mentions' }
    ];
    return checks.every(({ check }) => check());
  },
  async (args: TwitterArgs) => {
    // Similar implementation pattern
    const [titleRes, descRes, tweetRes] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create tweet title" }],
        // TODO add descriptions/more context to the tool calls
        tools: [{ type: "function", function: { name: "create_title", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } } }],
        tool_choice: { type: "function", function: { name: "create_title" } }
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create tweet description" }],
        tools: [{ type: "function", function: { name: "create_description", parameters: { type: "object", properties: { description: { type: "string" } }, required: ["description"] } } }],
        tool_choice: { type: "function", function: { name: "create_description" } }
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create tweet content" }],
        tools: [{ type: "function", function: { name: "create_tweet", parameters: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } } }],
        tool_choice: { type: "function", function: { name: "create_tweet" } }
      })
    ]);

    return {
      status: "created",
      title: JSON.parse(titleRes.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}').title ?? '',
      description: JSON.parse(descRes.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}').description ?? '',
      tweet: JSON.parse(tweetRes.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}').content ?? ''
    };
  }
);
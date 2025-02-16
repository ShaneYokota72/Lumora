import { Tool } from '../Tool';
import { validatorFunctions } from '../validators';

import { Groq } from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface FlashcardsArgs {
  topic: string;
  keywords?: string[];
}

export const flashcardsTool = new Tool(
  "create_flashcards",
  "Create flashcards for learning and memorization purposes",
  {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Main topic for the flashcards"
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "Key terms or concepts to create flashcards for"
      }
    },
    required: ["topic"]
  },
  `You are a flashcard creation assistant. Create flashcards when:
- There is a request to memorize or study content
- Key concepts need to be learned
Extract keywords that:
- Are definitions or key terms
- Have clear question/answer pairs
- Are important concepts to memorize`,
  (args: FlashcardsArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isOptionalArray(args.keywords), field: 'keywords' }
    ];
    return checks.every(({ check }) => check());
  },
  async (args: FlashcardsArgs) => {
    // Similar implementation to quiz but for flashcards
    const [titleRes, descRes, cardsRes] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create flashcards title" }],
        tools: [{ type: "function", function: { name: "create_title", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } } }],
        tool_choice: { type: "function", function: { name: "create_title" } }
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create flashcards description" }],
        tools: [{ type: "function", function: { name: "create_description", parameters: { type: "object", properties: { description: { type: "string" } }, required: ["description"] } } }],
        tool_choice: { type: "function", function: { name: "create_description" } }
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create flashcards" }],
        tools: [{ type: "function", function: { name: "create_cards", parameters: { type: "object", properties: { cards: { type: "array", items: { type: "object", properties: { front: { type: "string" }, back: { type: "string" } } } } }, required: ["cards"] } } }],
        tool_choice: { type: "function", function: { name: "create_cards" } }
      })
    ]);

    return {
      status: "created",
      title: JSON.parse(titleRes.choices[0].message.tool_calls?.[0]?.function?.arguments ?? '{"title":""}').title,
      description: JSON.parse(descRes.choices[0].message.tool_calls?.[0]?.function?.arguments ?? '{"description":""}').description,
      flashcards: JSON.parse(cardsRes.choices[0].message.tool_calls?.[0]?.function?.arguments ?? '{"cards":[]}').cards
    };
  }
);
import { Tool } from '../Tool';
import { validatorFunctions } from '../validators';

import { Groq } from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface QuizArgs {
  topic: string;
  keywords?: string[];
}

export const quizTool = new Tool(
  "create_quiz",
  "Create a pop quiz when there's a request to test knowledge on specific topics",
  {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Main topic of the quiz"
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "Key terms or concepts mentioned that should be included"
      }
    },
    required: ["topic"]
  },
  `You are a quiz creation assistant. Create quizzes when:
- There is an explicit request to test knowledge
- A specific topic is mentioned
Extract keywords that:
- Are key concepts or terms from the discussion
- Would make good quiz questions
- Are technical or specific terms`,
  (args: QuizArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isOptionalArray(args.keywords), field: 'keywords' }
    ];
    return checks.every(({ check }) => check());
  },
  async (args: QuizArgs) => {
    // Implementation remains similar to original
    const [titleRes, descRes, questionsRes] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create quiz title" }],
        tools: [{ type: "function", function: { name: "create_title", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } } }],
        tool_choice: { type: "function", function: { name: "create_title" } }
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create quiz description" }],
        tools: [{ type: "function", function: { name: "create_description", parameters: { type: "object", properties: { description: { type: "string" } }, required: ["description"] } } }],
        tool_choice: { type: "function", function: { name: "create_description" } }
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: "system", content: "Create quiz questions" }],
        tools: [{ type: "function", function: { name: "create_questions", parameters: { type: "object", properties: { questions: { type: "array", items: { type: "string" } } }, required: ["questions"] } } }],
        tool_choice: { type: "function", function: { name: "create_questions" } }
      })
    ]);

    return {
      status: "created",
      title: JSON.parse(titleRes.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}').title,
      description: JSON.parse(descRes.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}').description,
      questions: JSON.parse(questionsRes.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}').questions
    };
  }
);
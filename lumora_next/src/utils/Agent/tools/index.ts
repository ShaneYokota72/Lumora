import { Tool } from '../Tool';
import { meetingTool } from './meeting';
import { todoTool } from './todo';
import { quizTool } from './quiz';
import { flashcardsTool } from './flashcards';
import { twitterTool } from './twitter';
import { timelineTool } from './timeline';

export const tools = {
  meeting: meetingTool,
  todo: todoTool,
  quiz: quizTool,
  flashcards: flashcardsTool,
  twitter: twitterTool,
  timeline: timelineTool
} as const;

export type ToolTag = keyof typeof tools;
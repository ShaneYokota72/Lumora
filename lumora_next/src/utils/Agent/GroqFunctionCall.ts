import { title } from "process";
import { EventData } from "./types";

require('dotenv').config();
const { Groq } = require('groq-sdk');
const groq = new Groq(process.env.GROQ_API_KEY);

// Define models 
const ROUTING_MODEL = 'llama-3.3-70b-versatile';
const TOOL_USE_MODEL = 'llama-3.3-70b-versatile';

// Updated examples with new format
const zoomExamples = [
  // Meeting Example
  {
    messageType: 'transcript',
    data: "Alice: Let's schedule a meeting to review Q3 projections\nBob: I can do Wednesday at 2pm\nCharlie: Wednesday at 2pm works for me",
    from: "alice@company.com",
    to: ["bob@company.com", "charlie@company.com"],
    timestamp: "2025-02-15T14:00:00Z"
  },

  // Todo Example
  {
    messageType: 'chat',
    data: "High priority task: Please update the homepage mockup by next Friday EOD. This is blocking the development team.",
    from: "product_manager@company.com",
    to: ["design-team@company.com"],
    timestamp: "2025-02-15T15:00:00Z"
  },

  // Quiz Example
  {
    messageType: 'chat',
    data: "Please create a quiz to test knowledge on our new product features: user authentication, payment processing, and API integration",
    from: "trainer@company.com",
    to: ["team@company.com"],
    timestamp: "2025-02-15T16:00:00Z"
  },

  // Flashcard Example - Clear learning content
  {
    type: 'chat',
    message: "@team Create flashcards for studying our security protocols: access control, data encryption, and incident response procedures",
    sender: "security_lead@company.com",
    channel: "security-training"
  },

  // Twitter Example - All required parameters
  {
    type: 'chat',
    message: "@marketing-team Please tweet about our major milestone: we've reached 1M active users! Include link: https://blog.company.com/milestone, mention @productteam, and target our public audience",
    sender: "marketing_lead@company.com",
    channel: "marketing-announcements"
  },

  // Timeline Example - Multiple events with dependencies
  {
    type: 'meeting',
    transcript: [
      { speaker: "PM", text: "Let's create a timeline for Q2 launch: 1) Design specs due March 15th 2) Development phase April 1-20th 3) QA testing April 21-May 1st 4) Launch on May 15th" },
      { speaker: "Designer", text: "Design needs client requirements first, due next week" },
      { speaker: "Dev", text: "We'll need one week of testing after QA before launch" }
    ],
    participants: ["pm@company.com", "designer@company.com", "dev@company.com"],
    context: "Q2 Launch Planning"
  },

  // No Action Example - Just information
  {
    type: 'chat',
    message: "FYI team: The server maintenance was completed successfully.",
    sender: "tech_lead@company.com",
    channel: "tech-updates"
  }
];

// Parse Zoom data into LLM prompt
function parseZoomData(data: EventData) {
  if (data.messageType === 'TRANSCRIPT') {
    return `Conversation transcript from ${data.from} to ${(Array.isArray(data.to) ? data.to.join(', ') : data.to)}:\n${data.data}`;
  }
  const toRecipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;
  return `Chat message from ${data.from} to ${toRecipients}:\n"${data.data}"`;
}

// Tool definitions
const tools = {
  meeting: {
    type: "function",
    function: {
      name: "schedule_meeting",
      description: "Schedule a meeting with participants only if there is an explicit request to meet at a specific time. Do not schedule a meeting for casual questions, reminders, or statements that do not explicitly propose a meeting.",
      parameters: {
        type: "object",
        properties: {
          title: { 
            type: "string", 
            description: "Meeting title, derived from the context of the conversation" 
          },
          participants: { 
            type: "array", 
            items: { type: "string" },
            description: "Email addresses or identifiers of participants mentioned in the conversation"
          },
          time: { 
            type: "string", 
            description: "Proposed meeting time (e.g., 'Wednesday 2pm', 'ASAP'). Must be explicitly mentioned in the conversation." 
          },
          duration: { 
            type: "number", 
            description: "Meeting duration in minutes. Defaults to 30 if not specified.",
            default: 30 
          },
          unsure: {
            type: "boolean",
            description: "Set to true if no meeting time is mentioned, the meeting time is ambiguous (e.g., 'ASAP') or if there are conflicting schedules. It should be clear the day and time of the meeting.",
            default: false
          }
        },
        required: ["title", "participants", "time"]
      }
    }
  },
  todo: {
    type: "function",
    function: {
      name: "create_todo",
      description: "Create a todo item when there's a specific task or action item mentioned",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the todo item"
          },
          deadline: {
            type: "string",
            description: "Deadline for the task if mentioned"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Priority level of the task"
          }
        },
        required: ["title"]
      }
    }
  },
  quiz: {
    type: "function",
    function: {
      name: "create_quiz",
      description: "Create a pop quiz when there's a request to test knowledge on specific topics",
      parameters: {
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
      }
    }
  },
  flashcards: {
    type: "function",
    function: {
      name: "create_flashcards",
      description: "Create flashcards for learning and memorization purposes",
      parameters: {
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
      }
    }
  },
  twitter: {
    type: "function",
    function: {
      name: "create_tweet",
      description: "Create a tweet based on the conversation context",
      parameters: {
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
            description: "Any URLs to include in the tweet",
            optional: true
          },
          mentions: {
            type: "array",
            items: { type: "string" },
            description: "Twitter handles to mention",
            optional: true
          }
        },
        required: ["tweetType", "topic", "keyPoints", "audience"]
      }
    }
  },
  timeline: {
    type: "function",
    function: {
      name: "create_timeline",
      description: "Create a timeline of events or milestones from the conversation",
      parameters: {
        type: "object",
        properties: {
          project: {
            type: "string",
            description: "The project or context this timeline belongs to"
          },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Title or description of the event"
                },
                date: {
                  type: "string",
                  description: "Date or timeframe of the event"
                },
                type: {
                  type: "string",
                  enum: ["milestone", "deadline", "meeting", "release", "review", "other"],
                  description: "Type of event"
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Events that must be completed before this one",
                  optional: true
                }
              },
              required: ["title", "date", "type"]
            },
            description: "List of events in chronological order"
          },
          duration: {
            type: "string",
            description: "Total duration or timeframe of the timeline",
            optional: true
          }
        },
        required: ["project", "events"]
      }
    }
  },
  research: {
    type: "function",
    function: {
      name: "create_research",
      description: "Research a topic when there's a request to learn more or look into something",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Main topic to research"
          },
          context: {
            type: "string",
            description: "Additional context or specific aspects to focus on"
          },
          depth: {
            type: "string",
            enum: ["basic", "detailed", "comprehensive"],
            description: "How deep the research should go",
            default: "detailed"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Key terms or concepts to include in research",
            optional: true
          }
        },
        required: ["topic", "context"]
      }
    }
  }
};

const systemPrompts = {
  meeting: `You are a meeting scheduling assistant. Only schedule meetings when:
- There is an explicit request to meet
- A specific time is mentioned (e.g., "Wednesday at 2pm")
Do NOT schedule meetings for:
- General questions or discussions
- When time is ambiguous (e.g., just "ASAP" or "next week")
- Status updates without meeting requests
If there are conflicting times, set unsure=true.`,

  todo: `You are a todo creation assistant. Create todos when:
- There is a specific task or action item
- The task has a clear owner or assignee
- There is a deadline mentioned
- Do NOT create a todo for a timeline, instead use the timeline function/tool for that
Set priority based on:
- High: Critical path items, blockers, or urgent deadlines
- Medium: Important but not urgent tasks
- Low: Nice-to-have or non-urgent tasks
Do NOT create todos for general discussions or FYI messages.`,

  quiz: `You are a quiz creation assistant. Create quizzes when:
- There is an explicit request to test knowledge
- A specific topic is mentioned
Extract keywords that:
- Are key concepts or terms from the discussion
- Would make good quiz questions
- Are technical or specific terms
Do NOT create quizzes for general updates or discussions.`,

  flashcards: `You are a flashcard creation assistant. Create flashcards when:
- There is a request to memorize or study content
- Key concepts need to be learned
Extract keywords that:
- Are definitions or key terms
- Have clear question/answer pairs
- Are important concepts to memorize
Do NOT create flashcards for general discussions or updates.`,

  twitter: `You are a tweet creation assistant. Create tweets when:
- There is an explicit request to share on Twitter
- There is noteworthy news or updates to share
Determine tweet type based on:
- Announcement: New features, launches, major updates
- Milestone: Achievements, metrics, celebrations
- Update: Progress reports, minor changes
- Reminder: Upcoming events or deadlines
- Engagement: Community interaction, questions
Include URLs and mentions when specifically referenced.`,

  timeline: `You are a timeline creation assistant. Create timelines when timeline is mentioned:
- There are multiple events or milestones mentioned
- Dates or timeframes are specified
- Project phases are discussed
For each event, identify:
- Clear title and description
- Specific date or timeframe
- Type (milestone, deadline, meeting, release, review)
- Dependencies on other events
Sort events chronologically and track the total duration.
Do NOT create timelines for single events or general discussions.`,

  research: `You are a research assistant. Create research tasks when:
- Someone explicitly asks to research or look into something
- There's a need to gather more information on a topic
- Someone wants to learn more about a specific subject
Extract:
- The main topic to research
- Relevant context and focus areas
- Key terms and concepts
- Desired depth of research
Do NOT create research tasks for:
- General statements or observations
- Already well-understood topics
- Vague or ambiguous requests`
};

const validatorFunctions = {
  isString: (value: any) => typeof value === 'string' && value.length > 0,
  isArray: (value: any) => Array.isArray(value) && value.length > 0,
  isEnum: (value: any, allowed: any) => allowed.includes(value),
  isOptionalArray: (value: any) => !value || Array.isArray(value),
  isEventType: (value: any) => ["milestone", "deadline", "meeting", "release", "review", "other"].includes(value),
  isTweetType: (value: any) => ["announcement", "update", "reminder", "milestone", "engagement"].includes(value),
  isAudience: (value: any) => ["team", "clients", "public", "stakeholders"].includes(value),
  isPriority: (value: any) => !value || ["low", "medium", "high"].includes(value)
};

interface MeetingArgs {
  title: string;
  participants: string[];
  time: string;
}

interface TodoArgs {
  title: string;
  deadline?: string;
  priority?: string;
}

interface QuizArgs {
  topic: string;
  keywords?: string[];
}

interface FlashcardsArgs {
  topic: string;
  keywords?: string[];
}

interface TwitterArgs {
  tweetType: string;
  topic: string;
  keyPoints: string[];
  audience: string;
  urls?: string[];
  mentions?: string[];
}

interface TimelineArgs {
  project: string;
  events: Event[];
  duration?: string;
}

interface ResearchArgs {
  topic: string;
  context: string;
  depth?: string;
  keywords?: string[];
}

const validators = {
  meeting: (args: MeetingArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.title), field: 'title' },
      { check: () => validatorFunctions.isArray(args.participants), field: 'participants' },
      { check: () => validatorFunctions.isString(args.time), field: 'time' }
    ];
    return validateChecks(checks);
  },

  todo: (args: TodoArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.title), field: 'title' },
      { check: () => validatorFunctions.isString(args.deadline) || !args.deadline, field: 'deadline' },
      { check: () => validatorFunctions.isPriority(args.priority), field: 'priority' }
    ];
    return validateChecks(checks);
  },

  quiz: (args: QuizArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isOptionalArray(args.keywords), field: 'keywords' }
    ];
    return validateChecks(checks);
  },

  flashcards: (args: FlashcardsArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isOptionalArray(args.keywords), field: 'keywords' }
    ];
    return validateChecks(checks);
  },

  twitter: (args: TwitterArgs) => {
    const checks = [
      { check: () => validatorFunctions.isTweetType(args.tweetType), field: 'tweetType' },
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isArray(args.keyPoints), field: 'keyPoints' },
      { check: () => validatorFunctions.isAudience(args.audience), field: 'audience' },
      { check: () => validatorFunctions.isOptionalArray(args.urls), field: 'urls' },
      { check: () => validatorFunctions.isOptionalArray(args.mentions), field: 'mentions' }
    ];
    return validateChecks(checks);
  },

  timeline: (args: TimelineArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.project), field: 'project' },
      { check: () => validatorFunctions.isArray(args.events), field: 'events' },
      { check: () => args.events.every(event => validateEvent(event)), field: 'events' },
      { check: () => !args.duration || validatorFunctions.isString(args.duration), field: 'duration' }
    ];
    return validateChecks(checks);
  },

  research: (args: ResearchArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.topic), field: 'topic' },
      { check: () => validatorFunctions.isString(args.context), field: 'context' },
      { check: () => !args.depth || ['basic', 'detailed', 'comprehensive'].includes(args.depth), field: 'depth' },
      { check: () => validatorFunctions.isOptionalArray(args.keywords), field: 'keywords' }
    ];
    return validateChecks(checks);
  }
};

interface Check {
  check: () => boolean;
  field: string;
}
function validateChecks(checks: Check[]) {
  for (const { check, field } of checks) {
    if (!check()) {
      console.log(`Validation failed for field: ${field}`);
      return false;
    }
  }
  return true;
}

interface Event {
  title: string;
  date: string;
  type: string;
  dependencies?: string[];
}
function validateEvent(event: Event) {
  const checks = [
    { check: () => validatorFunctions.isString(event.title), field: 'event.title' },
    { check: () => validatorFunctions.isString(event.date), field: 'event.date' },
    { check: () => validatorFunctions.isEventType(event.type), field: 'event.type' },
    { check: () => validatorFunctions.isOptionalArray(event.dependencies), field: 'event.dependencies' }
  ];
  return validateChecks(checks);
}

// ACTUAL functions
async function scheduleMeeting(params: MeetingArgs) {
  const descriptionResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a meeting description based on the provided meeting details."
    }, {
      role: "user",
      content: `Title: ${params.title}\nParticipants: ${params.participants.join(', ')}\nTime: ${params.time}`
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

  const description = JSON.parse(descriptionResponse.choices[0].message.tool_calls[0].function.arguments).description;
  return { 
    status: "scheduled",
    desc: description
  };
}

async function createTodo(params: TodoArgs) {
  return { 
    status: "created",
  };
}

async function createQuiz(params: QuizArgs) {
  const titleResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a quiz title based on the topic and keywords."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKeywords: ${params.keywords?.join(', ')}`
    }],
    tools: [{
      type: "function", 
      function: {
        name: "create_quiz_title",
        description: "Create quiz title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Quiz title" }
          },
          required: ["title"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_quiz_title" } }
  });

  const descResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system", 
      content: "Create a quiz description based on the topic and keywords."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKeywords: ${params.keywords?.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_quiz_description",
        description: "Create quiz description",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "Quiz description" }
          },
          required: ["description"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_quiz_description" } }
  });

  const questionsResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create quiz questions based on the topic and keywords."
    }, {
      role: "user", 
      content: `Topic: ${params.topic}\nKeywords: ${params.keywords?.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_quiz_questions",
        description: "Create quiz questions",
        parameters: {
          type: "object",
          properties: {
            questions: { type: "array", items: { type: "string" }, description: "Quiz questions" }
          },
          required: ["questions"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_quiz_questions" } }
  });

  const title = JSON.parse(titleResponse.choices[0].message.tool_calls[0].function.arguments).title;
  const desc = JSON.parse(descResponse.choices[0].message.tool_calls[0].function.arguments).description;
  const questions = JSON.parse(questionsResponse.choices[0].message.tool_calls[0].function.arguments).questions;

  return {
    status: "created",
    title,
    desc,
    quiz: questions
  };
}

async function createFlashcards(params: FlashcardsArgs) {
  const titleResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a flashcards title based on the topic and keywords."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKeywords: ${params.keywords?.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_flashcards_title",
        description: "Create flashcards title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Flashcards title" }
          },
          required: ["title"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_flashcards_title" } }
  });

  const descResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL, 
    messages: [{
      role: "system",
      content: "Create a flashcards description based on the topic and keywords."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKeywords: ${params.keywords?.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_flashcards_description",
        description: "Create flashcards description",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "Flashcards description" }
          },
          required: ["description"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_flashcards_description" } }
  });

  const flashcardsResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create flashcards based on the topic and keywords."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKeywords: ${params.keywords?.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_flashcards",
        description: "Create flashcards",
        parameters: {
          type: "object",
          properties: {
            flashcards: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: { type: "string" },
                  back: { type: "string" }
                }
              },
              description: "Array of flashcards"
            }
          },
          required: ["flashcards"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_flashcards" } }
  });

  const title = JSON.parse(titleResponse.choices[0].message.tool_calls[0].function.arguments).title;
  const desc = JSON.parse(descResponse.choices[0].message.tool_calls[0].function.arguments).description;
  const flashcards = JSON.parse(flashcardsResponse.choices[0].message.tool_calls[0].function.arguments).flashcards;

  return {
    status: "created",
    title,
    desc,
    flashcards
  };
}

async function createTweet(params: TwitterArgs) {
  const titleResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a title for the tweet creation action."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKey Points: ${params.keyPoints.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_tweet_title",
        description: "Create tweet action title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title describing tweet creation" }
          },
          required: ["title"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_tweet_title" } }
  });

  const descResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a description of the tweet creation action."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nKey Points: ${params.keyPoints.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_tweet_description",
        description: "Create tweet action description",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "Description of tweet creation" }
          },
          required: ["description"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_tweet_description" } }
  });

  const tweetResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a tweet based on the provided details."
    }, {
      role: "user",
      content: `Tweet Type: ${params.tweetType}\nTopic: ${params.topic}\nKey Points: ${params.keyPoints.join(', ')}\nAudience: ${params.audience}\nMentions: ${params.mentions?.join(', ')}\nURLs: ${params.urls?.join(', ')}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_tweet",
        description: "Create tweet content",
        parameters: {
          type: "object",
          properties: {
            tweet: { type: "string", description: "Tweet content" }
          },
          required: ["tweet"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_tweet" } }
  });

  const title = JSON.parse(titleResponse.choices[0].message.tool_calls[0].function.arguments).title;
  const desc = JSON.parse(descResponse.choices[0].message.tool_calls[0].function.arguments).description;
  const tweet = JSON.parse(tweetResponse.choices[0].message.tool_calls[0].function.arguments).tweet;

  return {
    status: "created",
    title,
    desc,
    tweet
  };
}

async function createTimeline(params: TimelineArgs) {
  console.log("Creating timeline with params:", JSON.stringify(params, null, 2));
  return {
    status: "created",
    id: `timeline_${Math.floor(Math.random() * 1000)}`
  };
}

// the actual research function
async function createResearch(params: ResearchArgs) {
  const titleResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a title for the research task."
    }, {
      role: "user",
      content: `Topic: ${params.topic}\nContext: ${params.context}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_research_title",
        description: "Create research task title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title describing research task" }
          },
          required: ["title"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_research_title" } }
  });

  // perplexity api call here
  // TODO ADD API CALL
  const perplexityResponse = await searchPerplexity(params.topic, params.context, params.keywords);

  const summaryResponse = await groq.chat.completions.create({
    model: TOOL_USE_MODEL,
    messages: [{
      role: "system",
      content: "Create a summary of the research findings according to the user's context."
    }, {
      role: "user",
      content: `Research Results: ${JSON.stringify(perplexityResponse)}. User Context: ${params.context}`
    }],
    tools: [{
      type: "function",
      function: {
        name: "create_research_summary",
        description: "Create research summary",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Summary of research findings" },
            keyFindings: { type: "array", items: { type: "string" }, description: "Key findings from research" }
          },
          required: ["summary", "keyFindings"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "create_research_summary" } }
  });

  const title = JSON.parse(titleResponse.choices[0].message.tool_calls[0].function.arguments).title;
  const { summary, keyFindings } = JSON.parse(summaryResponse.choices[0].message.tool_calls[0].function.arguments);

  return {
    status: "created",
    title,
    summary,
    keyFindings,
    sources: perplexityResponse.sources
  };
}

// TODO add actual API call
async function searchPerplexity(topic: string, context: string, keywords?: string[]) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  // Construct research prompt
  let prompt = `Research the following topic: ${topic}\n`;
  prompt += `Context: ${context}\n`;
  if (keywords && keywords.length > 0) {
    prompt += `Key areas to focus on: ${keywords.join(', ')}`;
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide detailed, accurate information with sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract citations from response
    const sources = data.citations ? data.citations.map((url: string) => {
      return {
        title: url.split('/').pop() || url, // Use last part of URL as title
        url: url
      };
    }) : [];

    return {
      results: data.choices[0].message.content,
      sources: sources
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    return {
      results: "Error fetching research results",
      sources: []
    };
  }
}

type Route =  "meeting" | "todo" | "quiz" | "flashcards" | "twitter" |"timeline" | "research"
async function retryToolCall(route: Route, prompt: string, maxRetries = 2) {
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const response = await groq.chat.completions.create({
        model: TOOL_USE_MODEL,
        messages: [{
          role: "system",
          content: systemPrompts[route]
        }, {
          role: "user",
          content: prompt + (attempt > 0 ? "\nPlease try again with valid parameters." : "")
        }],
        tools: [tools[route]],
        tool_choice: "auto",
        max_completion_tokens: 1000
      });

      const message = response.choices[0].message;
      
      if (!message.tool_calls) {
        lastError = "No tool calls in response";
        attempt++;
        continue;
      }

      const toolCall = message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      if (!validators[route](args)) {
        lastError = `Invalid parameters for ${route}`;
        attempt++;
        continue;
      }

      return { toolCall, args };
    } catch (error) {
      if (error instanceof Error) {
        lastError = error.message;
      } else {
        lastError = String(error);
      }
      attempt++;
    }
  }

  throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError}`);
}

type ToolTag = "meeting" | "todo" | "quiz" | "flashcards" | "twitter" | "timeline";

export async function processZoomEvent(eventData: EventData, enabledTools: ToolTag[]) {
  try {
    const route = await routeQuery(eventData, enabledTools); // Pass enabledTools to routeQuery
    const prompt = parseZoomData(eventData);

    if (route === "none") {
      return {
        action: "no_action_needed",
        summary: "No actionable items detected"
      };
    }

    // Check if the routed tool is enabled. This should not happen (very unlikely)
    if (!enabledTools.includes(route as ToolTag)) {
      return {
        action: "tool_disabled",
        summary: `The ${route} tool is not enabled for this user`
      };
    }

    try {
      const { toolCall, args } = await retryToolCall(route, prompt);
      
      // this will only happen once the tool call is successful (doesnt matter that we have all tools here)
      switch (toolCall.function.name) {
        case 'schedule_meeting':
          const meetingResult = await scheduleMeeting(args);
            return {
              user_email: eventData.messageType === 'CHAT' ? eventData.to : eventData.from,
              title: args.title,
              desc: meetingResult.desc,
              tag: 'meeting',
              misc: {
                participants: args.participants,
                date: args.time,
                duration: args.duration || 30
              }
            };
        
        case 'create_todo':
          const todoResult = await createTodo(args);
          return {
            user_email: eventData.to,
            task: args.title,
            due_date: args.deadline || null,
            priority: args.priority || 'medium'
          };
        
        case 'create_quiz':
          const quizResult = await createQuiz(args);
          return {
            user_email: eventData.to,
            title: quizResult.title,
            desc: quizResult.desc,
            tag: 'quiz',
            misc: {
              quiz: quizResult.quiz
            }
          };
        
        case 'create_flashcards':
          const flashcardsResult = await createFlashcards(args);
          return {
            user_email: eventData.to,
            title: flashcardsResult.title,
            desc: flashcardsResult.desc,
            tag: 'flashcards',
            misc: {
              flashcardList: flashcardsResult.flashcards,
            }
          };

        case 'create_tweet':
          const tweetResult = await createTweet(args);
          return {
            user_email: eventData.to,
            tag: 'twitter',
            title: tweetResult.title,
            desc: tweetResult.desc,
            misc: {
                tweet: tweetResult.tweet
            }
          };

        case 'create_timeline':
          const timelineResult = await createTimeline(args);
          return {
            user_email: eventData.to,
            title: args.project,
            desc: `Timeline for ${args.project}`,
            tag: 'timeline',
            misc: {
              events: args.events,
              duration: args.duration,
            }
          };

        case 'create_research':
          const researchResult = await createResearch(args);
          return {
            user_email: eventData.to,
            title: researchResult.title,
            desc: researchResult.summary,
            tag: 'research',
            misc: {
              keyFindings: researchResult.keyFindings,
              sources: researchResult.sources,
              depth: args.depth || 'detailed'
            }
          };
      }
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

// modified routeQuery to accept enabledTools
async function routeQuery(eventData: EventData, enabledTools: ToolTag[]) {
  const prompt = parseZoomData(eventData);
  
  // use enabledTools to create system prompt that only includes enabled tools. Essentially tools are therefore disabled for the model.

  const enabledToolsPrompt = `Analyze the conversation and determine which tool is needed:
  ${enabledTools.includes("meeting") ? '- Respond with "TOOL: MEETING" if there\'s an explicit request to schedule a meeting' : ''}
  ${enabledTools.includes("todo") ? '- Respond with "TOOL: TODO" if there\'s a task or action item that needs tracking' : ''}
  ${enabledTools.includes("quiz") ? '- Respond with "TOOL: QUIZ" if there\'s a request to create a quiz or test' : ''}
  ${enabledTools.includes("flashcards") ? '- Respond with "TOOL: FLASHCARDS" if there\'s a request to create flashcards' : ''}
  ${enabledTools.includes("twitter") ? '- Respond with "TOOL: TWITTER" if there\'s a request to create a tweet' : ''}
  ${enabledTools.includes("timeline") ? '- Respond with "TOOL: TIMELINE" if there\'s a request to create a timeline' : ''}
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
    max_completion_tokens: 20
  });

  const decision = response.choices[0].message.content.trim();
  
  // double check if the tool is enabled
  if (decision.includes("TOOL: MEETING") && enabledTools.includes("meeting")) return "meeting";
  if (decision.includes("TOOL: TODO") && enabledTools.includes("todo")) return "todo";
  if (decision.includes("TOOL: QUIZ") && enabledTools.includes("quiz")) return "quiz";
  if (decision.includes("TOOL: FLASHCARDS") && enabledTools.includes("flashcards")) return "flashcards";
  if (decision.includes("TOOL: TWITTER") && enabledTools.includes("twitter")) return "twitter";
  if (decision.includes("TOOL: TIMELINE") && enabledTools.includes("timeline")) return "timeline";
  return "none";
}

// Test all examples
// async function testExamples() {
//   for (const [index, example] of zoomExamples.entries()) {
//     console.log(`\n=== Processing Example ${index + 1} ===`);
//     console.log("Input Data:", JSON.stringify(example, null, 2));

//     const result = await processZoomEvent(example);
    
//     console.log("\nResult:");
//     switch (result.action) {
//       case "meeting_scheduled":
//         console.log("Action: Meeting Scheduled");
//         console.log("Details:", result.details);
//         console.log("Meeting ID:", result.result.id);
//         break;
//       case "todo_created":
//         console.log("Action: Todo Created");
//         console.log("Title:", result.details.title);
//         console.log("Deadline:", result.details.deadline);
//         console.log("Priority:", result.details.priority);
//         console.log("Todo ID:", result.result.id);
//         break;
//       case "quiz_created":
//         console.log("Action: Quiz Created");
//         console.log("Topic:", result.details.topic);
//         console.log("Keywords:", result.details.keywords);
//         console.log("Quiz ID:", result.result.id);
//         break;
//       case "flashcards_created":
//         console.log("Action: Flashcards Created");
//         console.log("Topic:", result.details.topic);
//         console.log("Keywords:", result.details.keywords);
//         console.log("Flashcards ID:", result.result.id);
//         break;
//       case "tweet_created":
//         console.log("Action: Tweet Created");
//         console.log("Type:", result.details.tweetType);
//         console.log("Topic:", result.details.topic);
//         console.log("Key Points:", result.details.keyPoints);
//         console.log("Audience:", result.details.audience);
//         if (result.details.urls) console.log("URLs:", result.details.urls);
//         if (result.details.mentions) console.log("Mentions:", result.details.mentions);
//         console.log("Tweet ID:", result.result.id);
//         break;
//       case "timeline_created":
//         console.log("Action: Timeline Created");
//         console.log("Project:", result.details.project);
//         console.log("Events:", result.details.events.map(event => ({
//           title: event.title,
//           date: event.date,
//           type: event.type,
//           dependencies: event.dependencies || []
//         })));
//         if (result.details.duration) console.log("Duration:", result.details.duration);
//         console.log("Timeline ID:", result.result.id);
//         break;
//       case "no_action_needed":
//         console.log("Action: No Action Needed");
//         console.log("Summary:", result.summary);
//         break;
//       case "error":
//         console.log("Action: Error");
//         console.log("Error Message:", result.error);
//         if (result.details) {
//           console.log("Failed Route:", result.details.route);
//           console.log("Original Prompt:", result.details.prompt);
//         }
//         break;
//       default:
//         console.log("Unknown Action:", result.action);
//     }
//     console.log("=".repeat(30));
//   }
// }

// // Run tests
// testExamples().catch(console.error);
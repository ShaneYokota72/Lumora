import { Tool } from '../Tool';
import { validatorFunctions } from '../validators';

interface TimelineEvent {
  title: string;
  date: string;
  type: string;
  dependencies?: string[];
}

interface TimelineArgs {
  project: string;
  events: TimelineEvent[];
  duration?: string;
}

export const timelineTool = new Tool(
  "create_timeline",
  "Create a timeline of events or milestones from the conversation",
  {
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
              description: "Events that must be completed before this one"
            }
          },
          required: ["title", "date", "type"]
        },
        description: "List of events in chronological order"
      },
      duration: {
        type: "string",
        description: "Total duration or timeframe of the timeline"
      }
    },
    required: ["project", "events"]
  },
  `You are a timeline creation assistant. Create timelines when:
- There are multiple events or milestones mentioned
- Dates or timeframes are specified
- Project phases are discussed
For each event, identify:
- Clear title and description
- Specific date or timeframe
- Type (milestone, deadline, meeting, release, review)
- Dependencies on other events`,
  (args: TimelineArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.project), field: 'project' },
      { check: () => validatorFunctions.isArray(args.events), field: 'events' },
      { check: () => args.events.every(event => (
        validatorFunctions.isString(event.title) &&
        validatorFunctions.isString(event.date) &&
        validatorFunctions.isEventType(event.type) &&
        (!event.dependencies || validatorFunctions.isArray(event.dependencies))
      )), field: 'events' },
      { check: () => !args.duration || validatorFunctions.isString(args.duration), field: 'duration' }
    ];
    return checks.every(({ check }) => check());
  },
  async (args: TimelineArgs) => {
    return {
      status: "created",
      project: args.project,
      events: args.events,
      duration: args.duration
    };
  }
);
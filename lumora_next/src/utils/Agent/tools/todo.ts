import { Tool } from '../Tool';
import { validatorFunctions } from '../validators';

interface TodoArgs {
  title: string;
  deadline?: string;
  priority?: string;
}

export const todoTool = new Tool(
  "create_todo",
  "Create a todo item when there's a specific task or action item mentioned",
  {
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
  },
  `You are a todo creation assistant. Create todos when:
- There is a specific task or action item
- The task has a clear owner or assignee
- There is a deadline mentioned
Set priority based on:
- High: Critical path items, blockers, or urgent deadlines
- Medium: Important but not urgent tasks
- Low: Nice-to-have or non-urgent tasks`,
  (args: TodoArgs) => {
    const checks = [
      { check: () => validatorFunctions.isString(args.title), field: 'title' },
      { check: () => !args.deadline || validatorFunctions.isString(args.deadline), field: 'deadline' },
      { check: () => validatorFunctions.isPriority(args.priority), field: 'priority' }
    ];
    return checks.every(({ check }) => check());
  },
  async (args: TodoArgs) => {
    return {
      status: "created",
      title: args.title,
      deadline: args.deadline,
      priority: args.priority || "medium"
    };
  }
);
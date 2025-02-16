export interface ToolParameters {
  type: "object";
  properties: Record<string, any>;
  required: string[];
}

export class Tool {
  readonly name: string;
  readonly description: string;
  readonly parameters: ToolParameters;
  readonly systemPrompt: string;
  readonly validator: (args: any) => boolean;
  readonly handler: (args: any) => Promise<any>;

  constructor(
    name: string,
    description: string,
    parameters: ToolParameters,
    systemPrompt: string,
    validator: (args: any) => boolean,
    handler: (args: any) => Promise<any>
  ) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.systemPrompt = systemPrompt;
    this.validator = validator;
    this.handler = handler;
  }

  toFunction() {
    return {
      type: "function" as const,
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters
      }
    };
  }
}
export const validatorFunctions = {
  isString: (value: any) => typeof value === 'string' && value.length > 0,
  isArray: (value: any) => Array.isArray(value) && value.length > 0,
  isEnum: (value: any, allowed: any) => allowed.includes(value),
  isOptionalArray: (value: any) => !value || Array.isArray(value),
  isEventType: (value: any) => ["milestone", "deadline", "meeting", "release", "review", "other"].includes(value),
  isTweetType: (value: any) => ["announcement", "update", "reminder", "milestone", "engagement"].includes(value),
  isAudience: (value: any) => ["team", "clients", "public", "stakeholders"].includes(value),
  isPriority: (value: any) => !value || ["low", "medium", "high"].includes(value)
};
export class InvalidStepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStepError";
  }
}

export class StepExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StepExecutionError";
  }
}

export class ActionExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionExecutionError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

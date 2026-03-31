/**
 * Error codes for domain-level errors.
 * These codes can be used for i18n and programmatic error handling.
 */
export const ErrorCode = {
  // Game flow errors
  INVALID_STEP: "INVALID_STEP",
  STEP_EXECUTION_FAILED: "STEP_EXECUTION_FAILED",
  ACTION_EXECUTION_FAILED: "ACTION_EXECUTION_FAILED",

  // Entity not found errors
  LORD_NOT_FOUND: "LORD_NOT_FOUND",
  PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND",
  DOMINO_NOT_FOUND: "DOMINO_NOT_FOUND",
  MODE_NOT_FOUND: "MODE_NOT_FOUND",

  // Validation errors
  INVALID_PLAYER_COUNT: "INVALID_PLAYER_COUNT",
  INVALID_PLAYER_NAME: "INVALID_PLAYER_NAME",
  INVALID_PLACEMENT: "INVALID_PLACEMENT",
  PLACEMENT_NOT_EMPTY: "PLACEMENT_NOT_EMPTY",
  PLACEMENT_NOT_ADJACENT: "PLACEMENT_NOT_ADJACENT",
  PLACEMENT_INVALID_TERRAIN: "PLACEMENT_INVALID_TERRAIN",
  PLACEMENT_OUT_OF_BOUNDS: "PLACEMENT_OUT_OF_BOUNDS",
  PLACEMENT_EXCEEDS_KINGDOM_SIZE: "PLACEMENT_EXCEEDS_KINGDOM_SIZE",

  // Action errors
  NOT_YOUR_TURN: "NOT_YOUR_TURN",
  CANNOT_PICK: "CANNOT_PICK",
  CANNOT_PLACE: "CANNOT_PLACE",
  DOMINO_ALREADY_PICKED: "DOMINO_ALREADY_PICKED",

  // History errors
  UNDO_UNAVAILABLE: "UNDO_UNAVAILABLE",
  REDO_UNAVAILABLE: "REDO_UNAVAILABLE",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured domain error with code and context.
 */
export interface DomainError {
  /** Error code for programmatic handling */
  code: ErrorCodeType;
  /** Human-readable error message */
  message: string;
  /** Optional context data for debugging */
  context?: Record<string, unknown>;
}

/**
 * Creates a domain error object.
 */
export const createDomainError = (
  code: ErrorCodeType,
  message: string,
  context?: Record<string, unknown>
): DomainError => ({
  code,
  message,
  context,
});

/**
 * Base class for domain errors thrown by handlers.
 */
export class DomainException extends Error {
  public readonly code: ErrorCodeType;
  public readonly context?: Record<string, unknown>;

  constructor(error: DomainError) {
    super(error.message);
    this.name = "DomainException";
    this.code = error.code;
    this.context = error.context;
  }
}

/**
 * Error thrown when the game is in an invalid step for the requested action.
 */
export class InvalidStepError extends DomainException {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: ErrorCode.INVALID_STEP,
      message,
      context,
    });
    this.name = "InvalidStepError";
  }
}

/**
 * Error thrown when a step execution fails.
 */
export class StepExecutionError extends DomainException {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: ErrorCode.STEP_EXECUTION_FAILED,
      message,
      context,
    });
    this.name = "StepExecutionError";
  }
}

/**
 * Error thrown when an action execution fails.
 */
export class ActionExecutionError extends DomainException {
  constructor(
    message: string,
    code: ErrorCodeType = ErrorCode.ACTION_EXECUTION_FAILED,
    context?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      context,
    });
    this.name = "ActionExecutionError";
  }
}

/**
 * Error thrown when a required entity is not found.
 */
export class NotFoundError extends DomainException {
  constructor(
    message: string,
    code: ErrorCodeType = ErrorCode.LORD_NOT_FOUND,
    context?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      context,
    });
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends DomainException {
  constructor(
    message: string,
    code: ErrorCodeType,
    context?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      context,
    });
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when undo is requested but no previous state exists.
 */
export class UndoError extends DomainException {
  constructor(message = "No state to undo", context?: Record<string, unknown>) {
    super({
      code: ErrorCode.UNDO_UNAVAILABLE,
      message,
      context,
    });
    this.name = "UndoError";
  }
}

/**
 * Error thrown when redo is requested but no future state exists.
 */
export class RedoError extends DomainException {
  constructor(message = "No state to redo", context?: Record<string, unknown>) {
    super({
      code: ErrorCode.REDO_UNAVAILABLE,
      message,
      context,
    });
    this.name = "RedoError";
  }
}

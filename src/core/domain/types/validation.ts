/**
 * Severity level for a validation issue.
 * - "error": The state is corrupted and cannot be used safely.
 * - "warning": The state is suspicious but may still work.
 */
export type ValidationSeverity = "error" | "warning";

/**
 * Describes a single validation issue found in a game state.
 */
export type ValidationIssue = {
  /** JSON-path-like location of the issue (e.g. "players[0].kingdom") */
  path: string;
  /** Machine-readable code identifying the kind of issue */
  code: string;
  /** Human-readable description of the issue */
  message: string;
  /** Severity level */
  severity: ValidationSeverity;
};

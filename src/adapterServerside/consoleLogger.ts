import type { Logger } from "@core/portServerside/logger.js";

/**
 * Creates a lightweight console-based logger.
 * This is the default logger used when no custom logger is provided.
 * @param isLoggingEnabled - Whether logging is enabled
 * @returns A Logger instance that outputs to console
 */
export const consoleLogger = (isLoggingEnabled: boolean): Logger => {
  const formatMessage = (level: string, message: string): string => {
    const timestamp = new Date().toISOString();
    return `${timestamp} [KDomino_Engine] ${level}: ${message}`;
  };

  return {
    info: (message: string) => {
      if (isLoggingEnabled) {
        console.log(formatMessage("info", message));
      }
    },
    error: (message: string) => {
      if (isLoggingEnabled) {
        console.error(formatMessage("error", message));
      }
    },
  };
};

/**
 * A silent logger that does nothing.
 * Useful for testing or when logging should be completely disabled.
 */
export const silentLogger: Logger = {
  info: () => {},
  error: () => {},
};

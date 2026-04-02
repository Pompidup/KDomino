import type { Logger } from "@core/portServerside/logger.js";
import winston from "winston";

/**
 * Creates a Winston-based logger for advanced logging needs.
 *
 * **Note:** Winston is an optional peer dependency. To use this logger,
 * you must install winston separately:
 *
 * ```bash
 * npm install winston
 * ```
 *
 * @example
 * ```typescript
 * import { createGameEngine } from '@pompidup/kingdomino-engine';
 * import { winstonLogger } from '@pompidup/kingdomino-engine/adapters';
 *
 * const engine = createGameEngine({
 *   logger: winstonLogger(true)
 * });
 * ```
 *
 * @param isLoggingEnabled - Whether logging is enabled
 * @returns A Logger instance using Winston
 */
export const winstonLogger = (isLoggingEnabled: boolean): Logger => {
  const myFormat = winston.format.printf((info) => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
  });

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.label({ label: "KDomino_Engine" }),
      winston.format.timestamp(),
      winston.format.simple(),
      winston.format.json(),
      winston.format.colorize(),
      myFormat,
    ),
    transports: [new winston.transports.Console()],
  });

  return {
    info: (message: string) => {
      if (isLoggingEnabled) {
        logger.info(message);
      }
    },
    error: (message: string) => {
      if (isLoggingEnabled) {
        logger.error(message);
      }
    },
  };
};

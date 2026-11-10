import type { Logger } from "@core/portServerside/logger.js";
import winston from "winston";

/**
 * Creates a Winston-based logger for advanced logging needs.
 *
 * **Note:** This adapter is NOT part of the published bundle: nothing reachable
 * from `src/index.ts` (nor the universal / WASM bundles) imports it, so the
 * package has no dependency on winston, peer or otherwise, and stays
 * browser-safe. It is kept in the repository (winston is a dev dependency)
 * as a reference implementation of the `Logger` port. Server-side consumers
 * who want winston install it themselves and pass an equivalent logger:
 *
 * @example
 * ```typescript
 * import { createGameEngine, type Logger } from '@pompidup/kingdomino-engine';
 * import winston from 'winston';
 *
 * const w = winston.createLogger({ transports: [new winston.transports.Console()] });
 * const logger: Logger = { info: (m) => w.info(m), error: (m) => w.error(m) };
 * const engine = createGameEngine({ logger });
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

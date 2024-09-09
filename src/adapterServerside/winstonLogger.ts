import type { Logger } from "@core/portServerside/logger.js";
import winston from "winston";

export const winstonLogger = (isLoggingEnabled: boolean): Logger => {
  const myFormat = winston.format.printf(
    ({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    }
  );

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.label({ label: "KDomino_Engine" }),
      winston.format.timestamp(),
      winston.format.simple(),
      winston.format.json(),
      winston.format.colorize(),
      myFormat
    ),
    transports: [new winston.transports.Console()],
  });

  return {
    info: (message: string) => {
      if (isLoggingEnabled) {
        logger.info(message);
      }
      return void 0;
    },
    error: (message: string) => {
      if (isLoggingEnabled) {
        logger.error(message);
      }
      return void 0;
    },
  };
};

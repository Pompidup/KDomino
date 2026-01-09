import type { Logger } from "@core/portServerside/logger.js";
import type { GameState } from "@core/domain/types/index.js";
import type {
  SerializeGameCommand,
  DeserializeGameCommand,
} from "@application/commands/serializeGameCommand.js";
import {
  serializeGame,
  deserializeGame,
} from "@core/useCases/serialization.js";
import { isErr, unwrap } from "@utils/result.js";
import { StepExecutionError } from "@core/domain/errors/domainErrors.js";

type SerializeGameHandler = (command: SerializeGameCommand) => string;
type DeserializeGameHandler = (command: DeserializeGameCommand) => GameState;

/**
 * Creates a handler for serializing game state.
 */
export const serializeGameHandler = (
  logger: Logger
): SerializeGameHandler => {
  return (command) => {
    logger.info(`Serializing game: ${command.game.id}`);
    const serialized = serializeGame(command.game);
    logger.info(`Game serialized successfully`);
    return serialized;
  };
};

/**
 * Creates a handler for deserializing game state.
 */
export const deserializeGameHandler = (
  logger: Logger
): DeserializeGameHandler => {
  return (command) => {
    logger.info(`Deserializing game from JSON`);
    const result = deserializeGame(command.json);

    if (isErr(result)) {
      logger.error(`Failed to deserialize game: ${result.error}`);
      throw new StepExecutionError(result.error);
    }

    const game = unwrap(result);
    logger.info(`Game deserialized successfully: ${game.id}`);
    return game;
  };
};

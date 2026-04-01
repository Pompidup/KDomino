import type {
  DeserializeGameCommand,
  SerializeGameCommand,
} from "@application/commands/serializeGameCommand.js";
import {
  type ErrorCodeType,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import type { GameState } from "@core/domain/types/index.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import {
  deserializeGame,
  serializeGame,
} from "@core/useCases/serialization.js";
import { isErr, unwrap } from "@utils/result.js";

type SerializeGameHandler = (command: SerializeGameCommand) => string;
type DeserializeGameHandler = (command: DeserializeGameCommand) => GameState;

/**
 * Creates a handler for serializing game state.
 */
export const serializeGameHandler = (
  logger: Logger,
  _translator: Translator,
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
  logger: Logger,
  translator: Translator,
): DeserializeGameHandler => {
  return (command) => {
    logger.info(`Deserializing game from JSON`);
    const result = deserializeGame(command.json);

    if (isErr(result)) {
      logger.error(`Failed to deserialize game: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new StepExecutionError(translateErrorCode(translator, code), code);
    }

    const game = unwrap(result);
    logger.info(`Game deserialized successfully: ${game.id}`);
    return game;
  };
};

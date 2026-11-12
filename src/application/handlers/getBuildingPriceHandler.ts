import type {
  GetBuildersBoardPricesCommand,
  GetBuildingPriceCommand,
  GetDragonPriceCommand,
} from "@application/commands/getBuildingPriceCommand.js";
import {
  type ErrorCodeType,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type {
  BuildersBoardPrice,
  GetBuildersBoardPricesUseCase,
  GetBuildingPriceUseCase,
  GetDragonPriceUseCase,
} from "@core/useCases/getBuildingPrices.js";
import { isErr, type Result } from "@utils/result.js";

/**
 * Unwrap the result of a price query, throwing `NotFoundError`
 * (`PLAYER_NOT_FOUND`) for an unknown player, like `getMaxKnights`.
 */
const unwrapPrice = <T>(
  logger: Logger,
  translator: Translator,
  name: string,
  command: { game: { id: string }; playerId: string },
  result: Result<T>,
): T => {
  if (isErr(result)) {
    logger.error(`Error reading ${name}: ${result.error}`);
    const code = result.error as ErrorCodeType;
    throw new NotFoundError(translateErrorCode(translator, code), code, {
      gameId: command.game.id,
      playerId: command.playerId,
    });
  }
  logger.info(`${name}: ${JSON.stringify(result.value)}`);
  return result.value;
};

export const getBuildingPriceHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetBuildingPriceUseCase,
  ): ((command: GetBuildingPriceCommand) => number | null) =>
  (command) => {
    const { game, playerId, buildingId } = command;
    logger.info(
      `getBuildingPrice of building ${buildingId} for player ${playerId} in game: ${game.id}`,
    );
    return unwrapPrice(
      logger,
      translator,
      "getBuildingPrice",
      command,
      useCase(game, playerId, buildingId),
    );
  };

export const getDragonPriceHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetDragonPriceUseCase,
  ): ((command: GetDragonPriceCommand) => number) =>
  (command) => {
    const { game, playerId } = command;
    logger.info(`getDragonPrice for player ${playerId} in game: ${game.id}`);
    return unwrapPrice(
      logger,
      translator,
      "getDragonPrice",
      command,
      useCase(game, playerId),
    );
  };

export const getBuildersBoardPricesHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetBuildersBoardPricesUseCase,
  ): ((command: GetBuildersBoardPricesCommand) => BuildersBoardPrice[]) =>
  (command) => {
    const { game, playerId } = command;
    logger.info(
      `getBuildersBoardPrices for player ${playerId} in game: ${game.id}`,
    );
    return unwrapPrice(
      logger,
      translator,
      "getBuildersBoardPrices",
      command,
      useCase(game, playerId),
    );
  };

import type { CanPlaceDominoCommand } from "@application/commands/canPlaceDominoCommand.js";
import type { Domino, Kingdom } from "@core/domain/types/index.js";
import type { Translator } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";

type CanPlaceDominoUseCase = (
  kingdom: Kingdom,
  domino: Domino,
  maxKingdomSize?: number,
) => boolean;

type CanPlaceDominoHandler = (command: CanPlaceDominoCommand) => boolean;

/**
 * Creates a handler for checking if a domino can be placed.
 */
export const canPlaceDominoHandler = (
  logger: Logger,
  _translator: Translator,
  useCase: CanPlaceDominoUseCase,
): CanPlaceDominoHandler => {
  return (command) => {
    logger.info(`Checking if domino ${command.domino.number} can be placed`);
    const canPlace = useCase(
      command.kingdom,
      command.domino,
      command.maxKingdomSize,
    );
    logger.info(`Can place domino: ${canPlace}`);
    return canPlace;
  };
};

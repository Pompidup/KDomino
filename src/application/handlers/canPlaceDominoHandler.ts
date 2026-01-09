import type { Logger } from "@core/portServerside/logger.js";
import type { CanPlaceDominoCommand } from "@application/commands/canPlaceDominoCommand.js";
import { canPlaceDominoUseCase } from "@core/useCases/getValidPlacements.js";

type CanPlaceDominoHandler = (command: CanPlaceDominoCommand) => boolean;

/**
 * Creates a handler for checking if a domino can be placed.
 */
export const canPlaceDominoHandler = (
  logger: Logger
): CanPlaceDominoHandler => {
  return (command) => {
    logger.info(`Checking if domino ${command.domino.number} can be placed`);
    const canPlace = canPlaceDominoUseCase(command.kingdom, command.domino);
    logger.info(`Can place domino: ${canPlace}`);
    return canPlace;
  };
};

import type { Logger } from "@core/portServerside/logger.js";
import type { CanPlaceDominoCommand } from "@application/commands/canPlaceDominoCommand.js";
import type { Kingdom, Domino } from "@core/domain/types/index.js";

type CanPlaceDominoUseCase = (kingdom: Kingdom, domino: Domino, maxKingdomSize?: number) => boolean;

type CanPlaceDominoHandler = (command: CanPlaceDominoCommand) => boolean;

/**
 * Creates a handler for checking if a domino can be placed.
 */
export const canPlaceDominoHandler = (
  logger: Logger,
  useCase: CanPlaceDominoUseCase
): CanPlaceDominoHandler => {
  return (command) => {
    logger.info(`Checking if domino ${command.domino.number} can be placed`);
    const canPlace = useCase(command.kingdom, command.domino, command.maxKingdomSize);
    logger.info(`Can place domino: ${canPlace}`);
    return canPlace;
  };
};

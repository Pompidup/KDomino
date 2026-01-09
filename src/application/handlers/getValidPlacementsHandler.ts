import type { Logger } from "@core/portServerside/logger.js";
import type { GetValidPlacementsCommand } from "@application/commands/getValidPlacementsCommand.js";
import {
  getValidPlacementsUseCase,
  type ValidPlacement,
} from "@core/useCases/getValidPlacements.js";

type GetValidPlacementsHandler = (
  command: GetValidPlacementsCommand
) => ValidPlacement[];

/**
 * Creates a handler for getting valid placements.
 */
export const getValidPlacementsHandler = (
  logger: Logger
): GetValidPlacementsHandler => {
  return (command) => {
    logger.info(`Getting valid placements for domino: ${command.domino.number}`);
    const placements = getValidPlacementsUseCase(command.kingdom, command.domino);
    logger.info(`Found ${placements.length} valid placements`);
    return placements;
  };
};

import type { Logger } from "@core/portServerside/logger.js";
import type { GetValidPlacementsCommand } from "@application/commands/getValidPlacementsCommand.js";
import type { ValidPlacement } from "@core/useCases/getValidPlacements.js";
import type { Kingdom, Domino } from "@core/domain/types/index.js";

type GetValidPlacementsUseCase = (
  kingdom: Kingdom,
  domino: Domino
) => ValidPlacement[];

type GetValidPlacementsHandler = (
  command: GetValidPlacementsCommand
) => ValidPlacement[];

/**
 * Creates a handler for getting valid placements.
 */
export const getValidPlacementsHandler = (
  logger: Logger,
  useCase: GetValidPlacementsUseCase
): GetValidPlacementsHandler => {
  return (command) => {
    logger.info(`Getting valid placements for domino: ${command.domino.number}`);
    const placements = useCase(command.kingdom, command.domino);
    logger.info(`Found ${placements.length} valid placements`);
    return placements;
  };
};

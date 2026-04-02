import type { GetValidPlacementsCommand } from "@application/commands/getValidPlacementsCommand.js";
import type { Domino, Kingdom } from "@core/domain/types/index.js";
import type { Translator } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { ValidPlacement } from "@core/useCases/getValidPlacements.js";

type GetValidPlacementsUseCase = (
  kingdom: Kingdom,
  domino: Domino,
  maxKingdomSize?: number,
) => ValidPlacement[];

type GetValidPlacementsHandler = (
  command: GetValidPlacementsCommand,
) => ValidPlacement[];

/**
 * Creates a handler for getting valid placements.
 */
export const getValidPlacementsHandler = (
  logger: Logger,
  _translator: Translator,
  useCase: GetValidPlacementsUseCase,
): GetValidPlacementsHandler => {
  return (command) => {
    logger.info(
      `Getting valid placements for domino: ${command.domino.number}`,
    );
    const placements = useCase(
      command.kingdom,
      command.domino,
      command.maxKingdomSize,
    );
    logger.info(`Found ${placements.length} valid placements`);
    return placements;
  };
};

import type { Logger } from "@core/portServerside/logger.js";
import type { GetModesCommand } from "@application/commands/getModesCommand.js";
import { NotFoundError } from "@core/domain/errors/domainErrors.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { GetModesUseCase } from "@core/useCases/getModes.js";
import { isErr } from "@utils/result.js";

type GetModesHandler = (command: GetModesCommand) => GameMode[];

export const getModesHandler =
  (logger: Logger, useCase: GetModesUseCase): GetModesHandler =>
  (_command: GetModesCommand) => {
    logger.info("Getting modes");
    const result = useCase();

    if (isErr(result)) {
      logger.error(`Error getting modes: ${result.error}`);
      throw new NotFoundError(result.error);
    }

    logger.info(`Modes retrieved: ${result.value}`);
    return result.value;
  };

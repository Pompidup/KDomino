import type { GetModesCommand } from "@application/commands/getModesCommand.js";
import {
  ErrorCode,
  type ErrorCodeType,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { GetModesUseCase } from "@core/useCases/getModes.js";
import { isErr } from "@utils/result.js";

type GetModesHandler = (command: GetModesCommand) => GameMode[];

export const getModesHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetModesUseCase,
  ): GetModesHandler =>
  (_command: GetModesCommand) => {
    logger.info("Getting modes");
    const result = useCase();

    if (isErr(result)) {
      logger.error(`Error getting modes: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new NotFoundError(translateErrorCode(translator, code), code);
    }

    logger.info(`Modes retrieved: ${result.value}`);
    return result.value;
  };

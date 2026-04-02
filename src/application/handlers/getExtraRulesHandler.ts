import type { GetExtraRulesCommand } from "@application/commands/getExtraRulesCommand.js";
import {
  type ErrorCodeType,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import type { ExtraRule } from "@core/domain/types/rule.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { GetExtraRulesUseCase } from "@core/useCases/getExtraRules.js";
import { isErr } from "@utils/result.js";

type GetExtraRulesHandler = (command: GetExtraRulesCommand) => ExtraRule[];

export const getExtraRulesHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetExtraRulesUseCase,
  ): GetExtraRulesHandler =>
  (command: GetExtraRulesCommand) => {
    const { mode, players } = command;
    logger.info(
      `Getting extra rules for mode: ${mode} and players: ${players}`,
    );
    const result = useCase(mode, players);

    if (isErr(result)) {
      logger.error(`Error getting extra rules: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new NotFoundError(translateErrorCode(translator, code), code, {
        mode: command.mode,
      });
    }

    logger.info(`Extra rules retrieved: ${result.value}`);
    return result.value;
  };

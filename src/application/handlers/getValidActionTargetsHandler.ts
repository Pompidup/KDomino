import type { GetValidActionTargetsCommand } from "@application/commands/getValidActionTargetsCommand.js";
import type { Translator } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { ValidActionTargetsUseCase } from "@core/useCases/getValidActionTargets.js";

type GetValidActionTargetsHandler<T> = (
  command: GetValidActionTargetsCommand,
) => T;

/**
 * Creates a handler for one valid-target query (`getValidKnightPositions`,
 * `canSkipOptionalAction`, ...). Queries never throw: they answer empty when
 * the action does not apply.
 *
 * @param name - Query name, used in log messages
 * @param useCase - The query use case
 * @param describe - Summarizes the answer for the logs
 */
export const getValidActionTargetsHandler = <T>(
  logger: Logger,
  _translator: Translator,
  name: string,
  useCase: ValidActionTargetsUseCase<T>,
  describe: (answer: T) => string,
): GetValidActionTargetsHandler<T> => {
  return (command) => {
    const { game, lordId } = command;
    logger.info(`${name} for lord: ${lordId ?? "current"} in game: ${game.id}`);
    const answer = useCase(game, lordId);
    logger.info(`${name}: ${describe(answer)}`);
    return answer;
  };
};

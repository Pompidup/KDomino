import type { Logger } from "@core/portServerside/logger.js";
import type { GetDynastyResultCommand } from "@application/commands/getDynastyResultCommand.js";
import type {
  DynastyResult,
  GetDynastyResultUseCase,
} from "@core/useCases/getDynastyResult.js";

type GetDynastyResultHandler = (
  command: GetDynastyResultCommand
) => DynastyResult[];

export const getDynastyResultHandler = (
  logger: Logger,
  useCase: GetDynastyResultUseCase
): GetDynastyResultHandler => {
  return (command) => {
    logger.info(`Calculating dynasty results for ${command.games.length} games`);
    const results = useCase(command.games);
    logger.info(`Dynasty results calculated`);
    return results;
  };
};

import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import {
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameWithNextStep,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { AddPlayersUseCase } from "@core/useCases/addPlayers.js";
import { isErr } from "@utils/result.js";

type AddPlayersHandler = (command: AddPlayersCommand) => GameWithNextStep;

export const addPlayersHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: AddPlayersUseCase,
  ): AddPlayersHandler =>
  (command: AddPlayersCommand) => {
    const { game, players } = command;

    logger.info(`Adding players to game: ${game.id}`);

    if (!isGameWithNextStep(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'step' but got: ${game.nextAction.type}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "step", actual: game.nextAction.type, gameId: game.id },
      );
    }

    if (game.nextAction.step !== "addPlayers") {
      logger.error(
        `Required game with addPlayers step but got: ${game.nextAction.step}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "addPlayers",
          actual: game.nextAction.step,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, players);

    if (isErr(result)) {
      logger.error(`Error adding players: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new StepExecutionError(translateErrorCode(translator, code), code, {
        gameId: game.id,
        players: command.players,
      });
    }

    logger.info(`Players added to game: ${game.id}`);
    return result.value;
  };

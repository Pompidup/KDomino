import type { Logger } from "@core/portServerside/logger.js";
import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import {
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithNextStep,
} from "@core/domain/types/game.js";
import type { AddPlayersUseCase } from "@core/useCases/addPlayers.js";
import { isErr } from "@utils/result.js";

type AddPlayersHandler = (command: AddPlayersCommand) => GameWithNextStep;

export const addPlayersHandler =
  (logger: Logger, useCase: AddPlayersUseCase): AddPlayersHandler =>
  (command: AddPlayersCommand) => {
    const { game, players } = command;

    logger.info(`Adding players to game: ${game.id}`);

    if (!isGameWithNextStep(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'step' but got: ${game.nextAction.type}`
      );
      throw new InvalidStepError("Required game with nextAction type: 'step'");
    }

    if (game.nextAction.step !== "addPlayers") {
      logger.error(
        `Required game with addPlayers step but got: ${game.nextAction.step}`
      );
      throw new InvalidStepError("Required game with addPlayers step");
    }

    const result = useCase(game, players);

    if (isErr(result)) {
      logger.error(`Error adding players: ${result.error}`);
      throw new StepExecutionError(result.error);
    }

    logger.info(`Players added to game: ${game.id}`);
    return result.value;
  };

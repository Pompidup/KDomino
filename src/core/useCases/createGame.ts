import { create } from "@core/domain/entities/game.js";
import { createMode } from "@core/domain/entities/mode.js";
import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { ModeRepository } from "@core/portServerside/modeRepository.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type CreateGameUseCase = (mode: string) => Result<GameWithNextStep>;

export const createGameUseCase =
  (deps: {
    modeRepository: ModeRepository;
    dominoesRepository: DominoesRepository;
    uuidMethod: UuidMethod;
  }): CreateGameUseCase =>
  (mode) => {
    const { modeRepository, dominoesRepository, uuidMethod } = deps;
    const id = uuidMethod();
    const availableMode = modeRepository.getAvailables();
    const newMode = createMode(mode, availableMode);

    if (isErr(newMode)) {
      return newMode;
    }

    const dominoes = dominoesRepository.getForMode(newMode.value);

    if (!dominoes || dominoes.length === 0) {
      return err(`No dominoes found for mode ${newMode.value.name}`);
    }

    const payload = {
      id,
      mode: newMode.value,
      dominoes,
    };

    const newGame = create(payload);

    return ok(newGame);
  };

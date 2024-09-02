import { err, isErr, ok, type Result } from "../../utils/result.js";
import type { Game, NextStep } from "../domain/types/game.js";
import { create } from "../domain/entities/game.js";
import type { ModeRepository } from "../portServerside/modeRepository.js";
import type { DominoesRepository } from "core/portServerside/dominoesRepository.js";
import type { UuidMethod } from "../portServerside/uuidMethod.js";
import { createMode } from "../domain/entities/mode.js";

export type CreateGameUseCase = (
  mode: string
) => Result<Game & { nextAction: NextStep }>;

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

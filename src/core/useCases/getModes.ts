import type { GameMode } from "../domain/types/mode.js";
import { ok, type Result } from "../../utils/result.js";
import type { ModeRepository } from "core/portServerside/modeRepository.js";

export type GetModesUseCase = () => Result<GameMode[]>;

export const getModesUseCase =
  (deps: { modeRepository: ModeRepository }): GetModesUseCase =>
  (): Result<GameMode[]> => {
    const { modeRepository } = deps;
    return ok(modeRepository.getAvailables());
  };

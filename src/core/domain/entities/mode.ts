import { err, ok, type Result } from "../../../utils/result.js";
import type { GameMode } from "../types/mode.js";

const findMode = (
  mode: string,
  availableMode: GameMode[]
): GameMode | undefined => {
  return availableMode.find((m) => m.name === mode);
};

export const createMode = (
  mode: string,
  availableMode: GameMode[]
): Result<GameMode> => {
  const foundMode = findMode(mode, availableMode);
  if (foundMode) {
    return ok(foundMode);
  }

  return err(`Invalid mode: ${mode}`);
};

import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { GameMode } from "@core/domain/types/mode.js";
import { err, ok, type Result } from "@utils/result.js";

const findMode = (
  mode: string,
  availableMode: GameMode[],
): GameMode | undefined => {
  return availableMode.find((m) => m.name === mode);
};

export const createMode = (
  mode: string,
  availableMode: GameMode[],
): Result<GameMode> => {
  const foundMode = findMode(mode, availableMode);
  if (foundMode) {
    return ok(foundMode);
  }

  return err(ErrorCode.MODE_NOT_FOUND);
};

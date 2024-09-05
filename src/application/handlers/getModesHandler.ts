import { NotFoundError } from "../../core/domain/errors/domainErrors.js";
import type { GameMode } from "../../core/domain/types/mode.js";
import type { GetModesUseCase } from "../../core/useCases/getModes.js";
import { isErr } from "../../utils/result.js";
import type { GetModesCommand } from "../commands/getModesCommand.js";

type GetModesHandler = (command: GetModesCommand) => GameMode[];

export const getModesHandler =
  (getModeUseCase: GetModesUseCase): GetModesHandler =>
  (_command: GetModesCommand) => {
    const result = getModeUseCase();

    if (isErr(result)) {
      throw new NotFoundError(result.error);
    }

    return result.value;
  };

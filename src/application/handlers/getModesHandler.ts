import type { GetModesCommand } from "../commands/getModesCommand.js";
import type { GameMode } from "../../core/domain/types/mode.js";
import type { GetModesUseCase } from "../../core/useCases/getModes.js";
import { isErr } from "../../utils/result.js";

type GetModesHandler = (command: GetModesCommand) => GameMode[];

export const getModesHandler =
  (getModeUseCase: GetModesUseCase): GetModesHandler =>
  (_command: GetModesCommand) => {
    const result = getModeUseCase();

    if (isErr(result)) {
      throw new Error(result.error);
    }

    return result.value;
  };
import type { GameMode } from "@core/domain/types/mode.js";

export type ModeRepository = {
  getAvailables: () => GameMode[];
};

import type { GameMode } from "../domain/types/mode.js";

export type ModeRepository = {
  getAvailables: () => GameMode[];
};

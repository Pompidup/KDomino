import type { Domino } from "@core/domain/types/domino.js";
import type { GameMode } from "@core/domain/types/mode.js";

export type DominoesRepository = {
  getForMode: (mode: GameMode) => Domino[] | [];
};

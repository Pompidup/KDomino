import type { GameMode } from "@core/domain/types/mode.js";
import type { Domino } from "@core/domain/types/domino.js";

export type DominoesRepository = {
  getForMode: (mode: GameMode) => Domino[] | [];
};

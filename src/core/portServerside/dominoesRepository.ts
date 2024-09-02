import type { GameMode } from "../domain/types/mode.js";
import type { Domino } from "../domain/types/domino.js";

export type DominoesRepository = {
  getForMode: (mode: GameMode) => Domino[] | [];
};

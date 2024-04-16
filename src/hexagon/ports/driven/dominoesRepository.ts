import type { Domino } from "../../internal/entities/domino.js";

export type DominoesRepository = {
  getAll: () => Domino[];
};

import type { Domino } from "../entities/domino";

export type DominoesRepository = {
  getAll: () => Promise<Domino[]>;
};

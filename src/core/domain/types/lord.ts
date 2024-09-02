import type { Domino } from "./domino.js";

export type Lord = {
  id: string;
  playerId: string;
  turnEnded: boolean;
  hasPick: boolean;
  hasPlace: boolean;
  dominoPicked?: Domino;
};

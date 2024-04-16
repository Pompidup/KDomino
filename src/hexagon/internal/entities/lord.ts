import type { Domino } from "./domino";

export type Lord = {
  id: string;
  playerId: string;
  order: number;
  turnEnded: boolean;
  hasPick: boolean;
  hasPlace: boolean;
  dominoPicked?: Domino;
};

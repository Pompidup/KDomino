import type { Domino, RevealsDomino } from "./domino.js";
import type { Lord } from "./lord.js";
import type { Player } from "./player.js";
import type { Rule } from "./rule.js";

export type Game = {
  id: string;
  dominoes: Domino[];
  currentDominoes: RevealsDomino[];
  players: Player[];
  lords: Lord[];
  turn: number;
  maxTurns: number;
  maxDominoes: number;
  dominoesPerTurn: number;
  order: Record<number, string>;
  rules?: Rule[];
};

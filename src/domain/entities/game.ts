import type { Domino, RevealsDomino } from "./domino";
import type { Kingdom } from "./kingdom";

export type King = {
  id: string;
  playerId: string;
  order: number;
  turnEnded: boolean;
  hasPick: boolean;
  hasPlace: boolean;
  dominoPicked?: Domino;
};

export type Player = {
  id?: string;
  name: string;
  kingdom: Kingdom;
};

export type Game = {
  id: string;
  dominoes: Domino[];
  currentDominoes: RevealsDomino[];
  players: Player[];
  kings: King[];
  turn: number;
  maxTurns: number;
  maxDominoes: number;
  dominoesPerTurn: number;
  order: Record<number, string>;
};

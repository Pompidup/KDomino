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

export const availableMode = ["Classic"] as const;
export type AvailableMode = (typeof availableMode)[number];
export const isValidMode = (mode: string): mode is AvailableMode => {
  return availableMode.includes(mode as AvailableMode);
};

export type Rule = {
  name: string;
  description: string;
  mode: AvailableMode[];
  playersLimit?: number;
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
  rules?: Rule[];
};

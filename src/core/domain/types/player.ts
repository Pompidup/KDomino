import type { Kingdom } from "./kingdom.js";
import type { ObjectValues } from "./utils.js";

export type Player = {
  id: string;
  name: string;
  kingdom: Kingdom;
};

export type PlayerPayload = {
  name: string;
};

export type PlayersPayload = PlayerPayload[];

export type Players = Player[];

export const playerActions = {
  placeDomino: "placeDomino",
  pickDomino: "pickDomino",
  pass: "pass",
} as const;

export type PlayerActions = ObjectValues<typeof playerActions>;

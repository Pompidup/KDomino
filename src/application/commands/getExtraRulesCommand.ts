import type { GameMode } from "../../core/domain/types/mode.js";

export type GetExtraRulesCommand = {
  mode: GameMode["name"];
  players: number;
};

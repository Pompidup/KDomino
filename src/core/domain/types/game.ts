import type { Result } from "@utils/result.js";
import type { Domino, RevealsDomino } from "./domino.js";
import type { Lord } from "./lord.js";
import type { GameMode } from "./mode.js";
import type { Player, PlayerActions } from "./player.js";
import type { SelectedRules } from "./rule.js";
import type { ObjectValues } from "./utils.js";

export type Game = {
  id: string;
  dominoes: Domino[];
  currentDominoes: RevealsDomino[];
  players: Player[];
  lords: Lord[];
  turn: number;
  nextAction: NextAction | NextStep;
  rules: SelectedRules;
  mode: GameMode;
};

export const gameSteps = {
  addPlayers: "addPlayers",
  options: "options",
  start: "start",
  result: "result",
} as const;

export type GameSteps = ObjectValues<typeof gameSteps>;

export type NextAction = {
  type: "action";
  nextLord: string;
  nextAction: PlayerActions;
};

export type NextStep = {
  type: "step";
  step: GameSteps;
};

export type GameWithNextAction = Game & { nextAction: NextAction };
export type GameWithNextStep = Game & { nextAction: NextStep };
export type GameResult = Result<GameWithNextAction | GameWithNextStep>;

export const isGameWithNextAction = (
  game: GameWithNextAction | GameWithNextStep
): game is GameWithNextAction => {
  return game.nextAction.type === "action";
};

export type Score = {
  points: number;
  maxPropertiesSize: number;
  totalCrowns: number;
};

export type ScoreResult = {
  playerId: string;
  playerName: string;
  details: Score;
};

export type FinalResult = ScoreResult & {
  position: number;
};

export type GameWithResults = Game & { result: FinalResult[] };

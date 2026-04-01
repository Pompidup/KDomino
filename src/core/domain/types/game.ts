import type { Result } from "@utils/result.js";
import type { Domino, RevealsDomino } from "./domino.js";
import type { Lord } from "./lord.js";
import type { GameMode } from "./mode.js";
import type { Player, PlayerActions } from "./player.js";
import type { QueenDominoState } from "./queendomino.js";
import type { SelectedRules } from "./rule.js";
import type { ObjectValues } from "./utils.js";

/**
 * Represents the complete state of a Kingdomino game.
 * This is the main aggregate containing all game data.
 */
export type Game = {
  /** Unique identifier for the game */
  id: string;
  /** Remaining dominoes in the draw pile */
  dominoes: Domino[];
  /** Currently revealed dominoes available for picking */
  currentDominoes: RevealsDomino[];
  /** Players participating in the game with their kingdoms */
  players: Player[];
  /** Lords (player tokens) used for turn order and domino selection */
  lords: Lord[];
  /** Current turn number (1-based) */
  turn: number;
  /** Next required action or game step */
  nextAction: NextAction | NextStep;
  /** Active rules for this game */
  rules: SelectedRules;
  /** Game mode being played */
  mode: GameMode;
  /** Optional seed for deterministic shuffle (replays, sharing) */
  seed?: string;
  /** Queendomino-specific state (only present in QueenDomino mode) */
  queendomino?: QueenDominoState;
};

/**
 * Available game steps representing phases of game setup and completion.
 */
export const gameSteps = {
  /** Waiting for players to be added */
  addPlayers: "addPlayers",
  /** Optional rules selection phase */
  options: "options",
  /** Ready to start the game */
  start: "start",
  /** Game has ended, results available */
  result: "result",
} as const;

/** Union type of all possible game steps */
export type GameSteps = ObjectValues<typeof gameSteps>;

/**
 * Represents a player action that needs to be performed.
 * Used during active gameplay.
 */
export type NextAction = {
  /** Discriminator for action type */
  type: "action";
  /** ID of the lord who must perform the action */
  nextLord: string;
  /** The action the lord must perform */
  nextAction: PlayerActions;
};

/**
 * Represents a game phase transition.
 * Used during setup and game end.
 */
export type NextStep = {
  /** Discriminator for step type */
  type: "step";
  /** The current game step/phase */
  step: GameSteps;
};

/** Game state where a player action is required */
export type GameWithNextAction = Game & { nextAction: NextAction };

/** Game state where a phase transition is occurring */
export type GameWithNextStep = Game & { nextAction: NextStep };

/** Union of all possible game states */
export type GameState = GameWithNextAction | GameWithNextStep;

/** Result wrapper for game state operations */
export type GameStateResult = Result<GameState>;

/**
 * Type guard to check if the game requires a player action.
 * @param game - The game state to check
 * @returns True if the game is waiting for a player action
 */
export const isGameWithNextAction = (
  game: GameWithNextAction | GameWithNextStep
): game is GameWithNextAction => {
  return game.nextAction.type === "action";
};

/**
 * Type guard to check if the game is in a phase transition.
 * @param game - The game state to check
 * @returns True if the game is transitioning between phases
 */
export const isGameWithNextStep = (
  game: GameWithNextAction | GameWithNextStep
): game is GameWithNextStep => {
  return game.nextAction.type === "step";
};

/**
 * Represents the score calculation for a kingdom.
 */
export type Score = {
  /** Total points earned */
  points: number;
  /** Size of the largest contiguous property */
  maxPropertiesSize: number;
  /** Total number of crowns in the kingdom */
  totalCrowns: number;
};

/**
 * Score result for a specific player.
 */
export type ScoreResult = {
  /** Player's unique identifier */
  playerId: string;
  /** Player's display name */
  playerName: string;
  /** Detailed score breakdown */
  details: Score;
};

/**
 * Final result including ranking position.
 */
export type FinalResult = ScoreResult & {
  /** Player's final position (1 = winner) */
  position: number;
};

/** Game state with final results calculated */
export type GameWithResults = Game & { result: FinalResult[] };

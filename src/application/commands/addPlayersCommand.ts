import type { GameState } from "@core/domain/types/game.js";

/**
 * Input for a single player: either a name string (human) or an object with bot config.
 */
export type PlayerInput = string | { name: string; bot?: { strategyName: string } };

export type AddPlayersCommand = {
  game: GameState;
  players: PlayerInput[];
};

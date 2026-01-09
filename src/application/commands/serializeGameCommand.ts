import type { GameState } from "@core/domain/types/index.js";

/**
 * Command to serialize a game state to JSON.
 */
export type SerializeGameCommand = {
  /** The game state to serialize */
  game: GameState;
};

/**
 * Command to deserialize a game state from JSON.
 */
export type DeserializeGameCommand = {
  /** The JSON string to deserialize */
  json: string;
};

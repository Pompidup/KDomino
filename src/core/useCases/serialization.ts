import type { GameState } from "@core/domain/types/index.js";
import { err, ok, type Result } from "@utils/result.js";

/**
 * Serialization format version for backwards compatibility.
 */
const SERIALIZATION_VERSION = 1;

/**
 * Serialized game data structure.
 */
interface SerializedGame {
  version: number;
  data: GameState;
  timestamp: string;
}

/**
 * Serializes a game state to a JSON string.
 * The serialized string includes version information for future compatibility.
 *
 * @param game - The game state to serialize
 * @returns JSON string representation of the game
 */
export const serializeGame = (game: GameState): string => {
  const serialized: SerializedGame = {
    version: SERIALIZATION_VERSION,
    data: game,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(serialized);
};

/**
 * Deserializes a JSON string back to a game state.
 * Validates the structure and version before returning.
 *
 * @param json - The JSON string to deserialize
 * @returns Result containing the game state or an error
 */
export const deserializeGame = (json: string): Result<GameState> => {
  try {
    const parsed = JSON.parse(json) as SerializedGame;

    // Validate structure
    if (!parsed.version || !parsed.data) {
      return err("Invalid serialized game format");
    }

    // Check version compatibility
    if (parsed.version > SERIALIZATION_VERSION) {
      return err(
        `Unsupported serialization version: ${parsed.version}. Current version: ${SERIALIZATION_VERSION}`,
      );
    }

    // Validate essential game properties
    const game = parsed.data;
    if (!game.id || !game.players || !game.lords || !game.nextAction) {
      return err("Invalid game state structure");
    }

    return ok(game);
  } catch (error) {
    return err(`Failed to parse game JSON: ${(error as Error).message}`);
  }
};

/**
 * Creates a save point for the current game state.
 * Includes metadata for debugging and restore purposes.
 */
export interface GameSavePoint {
  /** Serialized game data */
  serialized: string;
  /** When the save was created */
  createdAt: string;
  /** Game ID for reference */
  gameId: string;
  /** Current turn number */
  turn: number;
}

/**
 * Creates a save point from a game state.
 *
 * @param game - The game state to save
 * @returns A save point object with metadata
 */
export const createSavePoint = (game: GameState): GameSavePoint => {
  return {
    serialized: serializeGame(game),
    createdAt: new Date().toISOString(),
    gameId: game.id,
    turn: game.turn,
  };
};

/**
 * Restores a game state from a save point.
 *
 * @param savePoint - The save point to restore from
 * @returns Result containing the restored game state or an error
 */
export const restoreFromSavePoint = (
  savePoint: GameSavePoint,
): Result<GameState> => {
  return deserializeGame(savePoint.serialized);
};

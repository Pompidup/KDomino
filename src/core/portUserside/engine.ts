import type {
  GameMode,
  GameWithResults,
  ExtraRule,
  GameState,
  GameWithNextAction,
  GameWithNextStep,
  Score,
} from "@core/domain/types/index.js";
import type { GetModesCommand } from "@application/commands/getModesCommand.js";
import type { GetExtraRulesCommand } from "@application/commands/getExtraRulesCommand.js";
import type { CreateGameCommand } from "@application/commands/createGameCommand.js";
import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import type { ChooseDominoCommand } from "@application/commands/chooseDominoCommand.js";
import type { PlaceDominoCommand } from "@application/commands/placeDominoCommand.js";
import type { DiscardDominoCommand } from "@application/commands/discardDominoCommand.js";
import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import type { CalculateScoreCommand } from "@application/commands/calculateScoreCommand.js";
import type { GetValidPlacementsCommand } from "@application/commands/getValidPlacementsCommand.js";
import type { CanPlaceDominoCommand } from "@application/commands/canPlaceDominoCommand.js";
import type {
  SerializeGameCommand,
  DeserializeGameCommand,
} from "@application/commands/serializeGameCommand.js";
import type { ValidPlacement } from "@core/useCases/getValidPlacements.js";

/**
 * The main interface for interacting with the Kingdomino game engine.
 *
 * This interface provides all methods needed to manage a complete game lifecycle,
 * from creation to scoring. Each method follows a command pattern and returns
 * an updated game state.
 *
 * @example
 * ```typescript
 * import { createGameEngine, isGameWithNextAction } from '@pompidup/kingdomino-engine';
 *
 * const engine = createGameEngine({});
 * let game = engine.createGame({ mode: 'Classic' });
 * game = engine.addPlayers({ game, players: ['Alice', 'Bob'] });
 * game = engine.startGame({ game });
 *
 * while (isGameWithNextAction(game)) {
 *   // Handle player actions...
 * }
 *
 * const results = engine.getResults({ game });
 * ```
 */
export type GameEngine = {
  /**
   * Retrieves all available game modes.
   * @param command - Empty command object
   * @returns Array of available game modes (e.g., 'Classic')
   */
  getModes: (command: GetModesCommand) => GameMode[];

  /**
   * Retrieves available extra rules for a specific mode and player count.
   * @param command - Contains mode name and number of players
   * @returns Array of applicable extra rules
   */
  getExtraRules: (command: GetExtraRulesCommand) => ExtraRule[];

  /**
   * Creates a new game instance with the specified mode.
   * This is the first step in setting up a game.
   * @param command - Contains the game mode name
   * @returns Game state with next step 'addPlayers'
   */
  createGame: (command: CreateGameCommand) => GameWithNextStep;

  /**
   * Adds players to the game and initializes their kingdoms.
   * Each player receives an empty kingdom with a castle at the center.
   * @param command - Contains game state and array of player names (2-4 players)
   * @returns Game state with next step 'options' or 'start'
   * @throws Error if player count is invalid or names are too short
   */
  addPlayers: (command: AddPlayersCommand) => GameWithNextStep;

  /**
   * Adds optional extra rules to modify gameplay.
   * @param command - Contains game state and array of extra rule names
   * @returns Game state with next step 'start'
   */
  addExtraRules: (command: AddExtraRulesCommand) => GameWithNextStep;

  /**
   * Starts the game, initializing lords, shuffling dominoes, and revealing the first set.
   * @param command - Contains the game state
   * @returns Game state with first player action required
   */
  startGame: (command: StartGameCommand) => GameWithNextAction;

  /**
   * Allows a lord to choose a domino from the currently revealed set.
   * The chosen domino is reserved for that lord to place later.
   * @param command - Contains game state, lord ID, and domino number to pick
   * @returns Updated game state with next action
   */
  chooseDomino: (command: ChooseDominoCommand) => GameWithNextAction;

  /**
   * Places a domino on the lord's kingdom at the specified position and rotation.
   * The domino must be adjacent to an existing tile and match terrain types.
   * @param command - Contains game state, lord ID, position {x, y}, and rotation (0, 90, 180, 270)
   * @returns Updated game state (may transition to 'result' step if game ends)
   * @throws Error if placement is invalid
   */
  placeDomino: (command: PlaceDominoCommand) => GameState;

  /**
   * Discards a domino when no valid placement exists.
   * The lord forfeits placing the domino this turn.
   * @param command - Contains game state and lord ID
   * @returns Updated game state with next action
   */
  discardDomino: (command: DiscardDominoCommand) => GameState;

  /**
   * Calculates and returns final results after the game ends.
   * Applies extra rule bonuses and ranks players.
   * @param command - Contains the final game state
   * @returns Game state with complete results including positions
   */
  getResults: (command: GetResultCommand) => GameWithResults;

  /**
   * Calculates the score for a single kingdom.
   * Useful for showing live scores during gameplay.
   * @param command - Contains the kingdom grid to score
   * @returns Score with points, largest property size, and total crowns
   */
  calculateScore: (command: CalculateScoreCommand) => Score;

  /**
   * Finds all valid placements for a domino on a kingdom.
   * Useful for AI players or showing available moves to human players.
   * @param command - Contains kingdom and domino to check
   * @returns Array of valid position/rotation combinations
   */
  getValidPlacements: (command: GetValidPlacementsCommand) => ValidPlacement[];

  /**
   * Checks if a domino can be placed anywhere on a kingdom.
   * Quick check before deciding to discard.
   * @param command - Contains kingdom and domino to check
   * @returns True if at least one valid placement exists
   */
  canPlaceDomino: (command: CanPlaceDominoCommand) => boolean;

  /**
   * Serializes the game state to a JSON string for persistence.
   * @param command - Contains the game state to serialize
   * @returns JSON string representation of the game
   */
  serialize: (command: SerializeGameCommand) => string;

  /**
   * Deserializes a JSON string back to a game state.
   * @param command - Contains the JSON string to parse
   * @returns The restored game state
   * @throws Error if the JSON is invalid or incompatible
   */
  deserialize: (command: DeserializeGameCommand) => GameState;
};

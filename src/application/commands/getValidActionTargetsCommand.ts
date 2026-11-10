import type { GameState } from "@core/domain/types/game.js";

/**
 * Command to query the valid targets of the current extension action
 * (Queendomino, Origins, Age of Giants).
 *
 * Any game state is accepted: the query answers empty (`[]`, or `false` for
 * `canSkipOptionalAction`) when the action is not the one the game waits for,
 * when it does not exist in the game mode, or when `lordId` is not the lord
 * that must play.
 */
export type GetValidActionTargetsCommand = {
  /** The current game state */
  game: GameState;
  /** Lord to check. Defaults to the lord that must play (`game.nextAction.nextLord`) */
  lordId?: string;
};

/** Command for `getValidFireTokenPositions` (Origins `placeFireToken`). */
export type GetValidFireTokenPositionsCommand = GetValidActionTargetsCommand;

/** Command for `getValidKnightPositions` (Queendomino `placeKnight`). */
export type GetValidKnightPositionsCommand = GetValidActionTargetsCommand;

/** Command for `getValidBuildingPositions` (Queendomino `constructBuilding`). */
export type GetValidBuildingPositionsCommand = GetValidActionTargetsCommand;

/** Command for `getAffordableBuildings` (Queendomino `constructBuilding`). */
export type GetAffordableBuildingsCommand = GetValidActionTargetsCommand;

/** Command for `getValidCavemanPlacements` (Origins Tribe `recruitCaveman`). */
export type GetValidCavemanPlacementsCommand = GetValidActionTargetsCommand;

/** Command for `getValidGiantPositions` (Age of Giants `placeGiant`). */
export type GetValidGiantPositionsCommand = GetValidActionTargetsCommand;

/** Command for `getValidGiantTargets` (Age of Giants `sendGiant`). */
export type GetValidGiantTargetsCommand = GetValidActionTargetsCommand;

/** Command for `canSkipOptionalAction` (`skipOptionalAction`). */
export type CanSkipOptionalActionCommand = GetValidActionTargetsCommand;

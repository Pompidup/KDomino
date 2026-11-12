import type { Game } from "@core/domain/types/game.js";

/**
 * Command for `getBuildingPrice` (Queendomino): the coins one player pays to
 * construct one building of the Builders Board.
 */
export type GetBuildingPriceCommand = {
  /** Game state, at any stage */
  game: Game;
  /** Id of the player who would construct the building */
  playerId: string;
  /** Id of the building (`BuildingTile.id`) on the Builders Board */
  buildingId: number;
};

/**
 * Command for `getDragonPrice` (Queendomino): the coins one player pays to
 * bribe the Dragon.
 */
export type GetDragonPriceCommand = {
  /** Game state, at any stage */
  game: Game;
  /** Id of the player who would use the Dragon */
  playerId: string;
};

/**
 * Command for `getBuildersBoardPrices` (Queendomino): the price of every
 * building of the Builders Board for one player.
 */
export type GetBuildersBoardPricesCommand = {
  /** Game state, at any stage */
  game: Game;
  /** Id of the player whose prices are read */
  playerId: string;
};

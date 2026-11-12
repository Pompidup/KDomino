import {
  getBuildingPrice,
  getDragonPrice,
} from "@core/domain/entities/building.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { Game } from "@core/domain/types/game.js";
import type { Player } from "@core/domain/types/player.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

/*
 * Prices of the Queendomino actions that cost coins (constructing a building,
 * bribing the Dragon), as the actions debit them. Every query reads the price
 * from the same domain functions as the actions (`getBuildingPrice`,
 * `getDragonPrice`), so a client never recomputes a rule of the game.
 *
 * Read-only: they accept a game at any stage and are not tied to the action
 * the game waits for. They return `PLAYER_NOT_FOUND` for an unknown player,
 * like `getMaxKnights` and `calculatePlayerScore`.
 */

/** Price of one building of the Builders Board for one player. */
export type BuildersBoardPrice = {
  /** Building to pass as `buildingId` to `constructBuilding` */
  buildingId: number;
  /** Index of its spot in `buildersBoard.slots` (and `slotCosts`) */
  slotIndex: number;
  /**
   * Coins the player pays to construct it: the spot cost, minus 1 coin
   * (never below 0) for the player hosting the Queen.
   */
  price: number;
};

export type GetBuildingPriceUseCase = (
  game: Game,
  playerId: string,
  buildingId: number,
) => Result<number | null>;

export type GetDragonPriceUseCase = (
  game: Game,
  playerId: string,
) => Result<number>;

export type GetBuildersBoardPricesUseCase = (
  game: Game,
  playerId: string,
) => Result<BuildersBoardPrice[]>;

const findPlayer = (game: Game, playerId: string): Result<Player> => {
  const player = game.players.find((p) => p.id === playerId);
  return player ? ok(player) : err(ErrorCode.PLAYER_NOT_FOUND);
};

/**
 * Coins `playerId` pays to construct the building `buildingId`: the cost of
 * its spot on the Builders Board, minus the Queen's discount for her host.
 * `null` when the building is not on the board (or outside Queendomino).
 */
export const getBuildingPriceUseCase: GetBuildingPriceUseCase = (
  game,
  playerId,
  buildingId,
) => {
  const player = findPlayer(game, playerId);
  if (isErr(player)) return player;

  const queendomino = game.queendomino;
  if (!queendomino) return ok(null);

  return ok(
    getBuildingPrice(
      queendomino.buildersBoard,
      player.value,
      buildingId,
      queendomino.queenHolderId,
    ),
  );
};

/**
 * Coins `playerId` pays to bribe the Dragon (1 coin, whatever the building).
 * Whether the Dragon can be used now is answered by `getValidDragonTargets`.
 */
export const getDragonPriceUseCase: GetDragonPriceUseCase = (
  game,
  playerId,
) => {
  const player = findPlayer(game, playerId);
  if (isErr(player)) return player;
  return ok(getDragonPrice(player.value));
};

/**
 * Price of every building of the Builders Board for `playerId`, spot by spot
 * (empty spots left out). Empty outside Queendomino.
 */
export const getBuildersBoardPricesUseCase: GetBuildersBoardPricesUseCase = (
  game,
  playerId,
) => {
  const player = findPlayer(game, playerId);
  if (isErr(player)) return player;

  const queendomino = game.queendomino;
  if (!queendomino) return ok([]);

  const board = queendomino.buildersBoard;
  const prices: BuildersBoardPrice[] = [];
  board.slots.forEach((slot, slotIndex) => {
    if (!slot) return;
    const price = getBuildingPrice(
      board,
      player.value,
      slot.id,
      queendomino.queenHolderId,
    );
    if (price !== null) prices.push({ buildingId: slot.id, slotIndex, price });
  });
  return ok(prices);
};

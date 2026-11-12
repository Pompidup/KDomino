import type {
  BuildersBoard,
  BuildingSlot,
  BuildingTile,
  PlacedBuilding,
} from "@core/domain/types/building.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import type { QueenDominoState } from "@core/domain/types/queendomino.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import {
  addBonusKnights,
  addCoins,
  addTowers,
  canAfford,
  DRAGON_COST,
  QUEEN_DISCOUNT,
  removeCoins,
} from "./economy.js";

/**
 * Construction cost of each spot of the official Builders' Board, from the
 * spot next to the draw pile to the cheapest one (Queendomino rulebook, Set up
 * E: "The number below each tile represents the construction cost for each
 * building"; the 6 spots read 5, 4, 3, 2, 1 and 0).
 */
export const BUILDERS_BOARD_SLOT_COSTS: readonly number[] = [5, 4, 3, 2, 1, 0];

/** Number of visible building spots on the Builders Board (6) */
const BOARD_SLOTS = BUILDERS_BOARD_SLOT_COSTS.length;

/**
 * Official setup (Set up D-E): shuffle the building tiles, then place the top
 * 6 tiles on the spots of the Builders' Board; the rest is the draw pile.
 */
export const createBuildersBoard = (
  tiles: BuildingTile[],
  shuffle: ShuffleMethod,
): BuildersBoard => {
  const shuffled = shuffle([...tiles]);
  const slots: BuildingSlot[] = shuffled.slice(0, BOARD_SLOTS);
  while (slots.length < BOARD_SLOTS) slots.push(null);
  const drawPile = shuffled.slice(BOARD_SLOTS);

  return {
    slots,
    drawPile,
    slotCosts: [...BUILDERS_BOARD_SLOT_COSTS],
  };
};

/**
 * Official rule ("Starting a New Round"): "Slide the Building Tiles remaining
 * on the Builders' Board over to the cheapest spots, and then fill the empty
 * spots with Building Tiles from the draw pile".
 *
 * Spots are ordered from the most expensive to the cheapest (`slotCosts`), so
 * the remaining tiles move to the end of `slots` (keeping their order) and the
 * draw pile fills the freed spots, the cheapest free spot first.
 *
 * A board without `slotCosts` (games started before the official board, where
 * the price is carried by the tile) is refilled in place, without sliding.
 */
export const refillBuildersBoard = (board: BuildersBoard): BuildersBoard => {
  const newDrawPile = [...board.drawPile];

  if (!board.slotCosts) {
    const newSlots = [...board.slots];
    for (let i = 0; i < newSlots.length; i++) {
      if (newSlots[i] === null && newDrawPile.length > 0) {
        newSlots[i] = newDrawPile.shift()!;
      }
    }
    return { slots: newSlots, drawPile: newDrawPile };
  }

  const remaining = board.slots.filter(
    (slot): slot is BuildingTile => slot !== null,
  );
  const empty = board.slots.length - remaining.length;
  const newSlots: BuildingSlot[] = [
    ...Array.from({ length: empty }, (): BuildingSlot => null),
    ...remaining,
  ];
  for (let i = empty - 1; i >= 0 && newDrawPile.length > 0; i--) {
    newSlots[i] = newDrawPile.shift()!;
  }

  return { ...board, slots: newSlots, drawPile: newDrawPile };
};

/**
 * Prepare the Queendomino state for a new round.
 *
 * Official rule ("Starting a New Round"): send the Dragon back to its cave,
 * slide the remaining tiles to the cheapest spots and fill the empty spots of
 * the Builders' Board from the draw pile. Spots emptied by a construction or
 * by the Dragon stay empty for the rest of the round.
 */
export const startNewQueenDominoRound = (
  state: QueenDominoState,
): QueenDominoState => ({
  ...state,
  buildersBoard: refillBuildersBoard(state.buildersBoard),
  dragonUsedThisRound: false,
});

/**
 * Price of the spot `slotIndex` before the Queen's discount: the spot cost
 * (`slotCosts`), or the tile's own cost on a board without spot costs. `null`
 * for an empty or unknown spot.
 */
export const getSlotCost = (
  board: BuildersBoard,
  slotIndex: number,
): number | null => {
  const building = board.slots[slotIndex];
  if (!building) return null;
  return board.slotCosts?.[slotIndex] ?? building.cost;
};

/**
 * What `player` pays to construct the building of spot `slotIndex`: the spot
 * price, lowered by 1 coin (never below 0) when the player hosts the Queen
 * (official rule: "When your kingdom hosts the Queen, she lowers your
 * construction costs by 1 Coin"). `null` for an empty or unknown spot.
 */
export const getConstructionCost = (
  board: BuildersBoard,
  slotIndex: number,
  isQueenHost: boolean,
): number | null => {
  const cost = getSlotCost(board, slotIndex);
  if (cost === null) return null;
  return Math.max(0, cost - (isQueenHost ? QUEEN_DISCOUNT : 0));
};

/**
 * Single source of truth for the price of a building: the coins `player`
 * pays to construct the building `buildingId` of the Builders Board, i.e. the
 * cost of its spot (`slotCosts`, or the tile's own cost on a board without
 * spot costs), lowered by 1 coin (never below 0) when the player hosts the
 * Queen (`queenHolderId`). `null` when the building is not on the board.
 *
 * Used by `purchaseBuilding` (hence `constructBuilding` and
 * `getAffordableBuildings`) and by the `getBuildingPrice` /
 * `getBuildersBoardPrices` queries.
 */
export const getBuildingPrice = (
  board: BuildersBoard,
  player: Player,
  buildingId: number,
  queenHolderId: string | null = null,
): number | null => {
  const found = findBuildingOnBoard(board, buildingId);
  if (!found) return null;
  return getConstructionCost(
    board,
    found.slotIndex,
    queenHolderId !== null && queenHolderId === player.id,
  );
};

/**
 * Single source of truth for the price of the Dragon: the coins `player` pays
 * to burn a building (official rule, action D: "Pay the bank 1 Coin",
 * `DRAGON_COST`), whatever the building and the player. Used by
 * `destroyWithDragon` (hence `useDragon` and `getValidDragonTargets`) and by
 * the `getDragonPrice` query.
 */
export const getDragonPrice = (_player: Player): number => DRAGON_COST;

export const findBuildingOnBoard = (
  board: BuildersBoard,
  buildingId: number,
): { building: BuildingTile; slotIndex: number } | null => {
  for (let i = 0; i < board.slots.length; i++) {
    const slot = board.slots[i];
    if (slot && slot.id === buildingId) {
      return { building: slot, slotIndex: i };
    }
  }
  return null;
};

export const removeBuildingFromBoard = (
  board: BuildersBoard,
  slotIndex: number,
): BuildersBoard => {
  const newSlots = [...board.slots];
  newSlots[slotIndex] = null;
  return { ...board, slots: newSlots };
};

/**
 * Buy the building `buildingId` of the Builders Board for `player`: pay its
 * construction cost (`getBuildingPrice`, with the Queen's discount when
 * `queenHolderId` is the player), apply its immediate bonus and its towers,
 * and empty its spot. `null` when the building is not on the board or the
 * player cannot pay for it.
 */
export const purchaseBuilding = (
  board: BuildersBoard,
  player: Player,
  buildingId: number,
  queenHolderId: string | null = null,
): {
  updatedBoard: BuildersBoard;
  updatedPlayer: Player;
  building: BuildingTile;
  /** Coins paid */
  cost: number;
} | null => {
  const found = findBuildingOnBoard(board, buildingId);
  if (!found) return null;

  const { building, slotIndex } = found;
  const cost = getBuildingPrice(board, player, buildingId, queenHolderId);
  if (cost === null || !canAfford(player, cost)) return null;

  let updatedPlayer = removeCoins(player, cost);

  // Apply immediate bonus
  if (building.immediateBonus) {
    switch (building.immediateBonus.type) {
      case "coins":
        updatedPlayer = addCoins(updatedPlayer, building.immediateBonus.amount);
        break;
      case "tower":
        updatedPlayer = addTowers(
          updatedPlayer,
          building.immediateBonus.amount,
        );
        break;
      case "knight":
        updatedPlayer = addBonusKnights(
          updatedPlayer,
          building.immediateBonus.amount,
        );
        break;
    }
  }

  // Add towers from the building itself
  if (building.towers > 0) {
    updatedPlayer = addTowers(updatedPlayer, building.towers);
  }

  const updatedBoard = removeBuildingFromBoard(board, slotIndex);

  return { updatedBoard, updatedPlayer, building, cost };
};

export const hasOpenConstructionSquare = (
  kingdom: Kingdom,
  placedBuildings: PlacedBuilding[],
): boolean => {
  const occupiedPositions = new Set(
    placedBuildings.map((b) => `${b.position.x},${b.position.y}`),
  );

  for (let y = 0; y < kingdom.length; y++) {
    const row = kingdom[y]!;
    for (let x = 0; x < row.length; x++) {
      const tile = row[x]!;
      if (
        tile.type !== "empty" &&
        tile.type !== "castle" &&
        "hasConstructionSquare" in tile &&
        tile.hasConstructionSquare &&
        !occupiedPositions.has(`${x},${y}`)
      ) {
        return true;
      }
    }
  }
  return false;
};

export const isValidConstructionPosition = (
  kingdom: Kingdom,
  placedBuildings: PlacedBuilding[],
  position: Position,
): boolean => {
  const tile = kingdom[position.y]?.[position.x];
  if (!tile || tile.type === "empty" || tile.type === "castle") return false;
  if (!("hasConstructionSquare" in tile) || !tile.hasConstructionSquare)
    return false;

  const occupied = placedBuildings.some(
    (b) => b.position.x === position.x && b.position.y === position.y,
  );
  return !occupied;
};

export const placeBuildingOnKingdom = (
  kingdom: Kingdom,
  building: BuildingTile,
  position: Position,
): Kingdom => {
  // Add building crowns to the tile
  const newKingdom = kingdom.map((row) => [...row]);
  const tile = newKingdom[position.y]![position.x]!;

  if (tile.type !== "empty" && tile.type !== "castle") {
    newKingdom[position.y]![position.x] = {
      ...tile,
      crowns: tile.crowns + building.crowns,
    };
  }

  return newKingdom;
};

/**
 * Burn the building `buildingId` of the Builders Board with the Dragon.
 *
 * Official rule (action D): "Choose any Building Tile that is still available
 * on the Builders' Board", "Pay the bank 1 Coin" (`getDragonPrice`, whatever the
 * building) and discard the tile for the rest of the game. `null` when the
 * building is not on the board or the player cannot pay the coin.
 */
export const destroyWithDragon = (
  board: BuildersBoard,
  buildingId: number,
  player: Player,
): {
  updatedBoard: BuildersBoard;
  updatedPlayer: Player;
} | null => {
  const found = findBuildingOnBoard(board, buildingId);
  if (!found) return null;

  const { slotIndex } = found;
  const cost = getDragonPrice(player);
  if (!canAfford(player, cost)) return null;

  const updatedPlayer = removeCoins(player, cost);
  const updatedBoard = removeBuildingFromBoard(board, slotIndex);

  return { updatedBoard, updatedPlayer };
};

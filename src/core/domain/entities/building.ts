import type {
  BuildersBoard,
  BuildingTile,
  PlacedBuilding,
} from "@core/domain/types/building.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import { addCoins, addTowers, canAfford, removeCoins } from "./economy.js";

/** Number of visible building slots on the Builders Board */
const BOARD_SLOTS = 4;

export const createBuildersBoard = (
  tiles: BuildingTile[],
  shuffle: ShuffleMethod,
): BuildersBoard => {
  const shuffled = shuffle([...tiles]);
  const slots = shuffled.slice(0, BOARD_SLOTS);
  const drawPile = shuffled.slice(BOARD_SLOTS);

  return {
    slots,
    drawPile,
  };
};

export const refillBuildersBoard = (board: BuildersBoard): BuildersBoard => {
  const newSlots = [...board.slots];
  const newDrawPile = [...board.drawPile];

  for (let i = 0; i < newSlots.length; i++) {
    if (newSlots[i] === null && newDrawPile.length > 0) {
      newSlots[i] = newDrawPile.shift()!;
    }
  }

  return { slots: newSlots, drawPile: newDrawPile };
};

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

export const purchaseBuilding = (
  board: BuildersBoard,
  player: Player,
  buildingId: number,
): {
  updatedBoard: BuildersBoard;
  updatedPlayer: Player;
  building: BuildingTile;
} | null => {
  const found = findBuildingOnBoard(board, buildingId);
  if (!found) return null;

  const { building, slotIndex } = found;
  if (!canAfford(player, building.cost)) return null;

  let updatedPlayer = removeCoins(player, building.cost);

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
    }
  }

  // Add towers from the building itself
  if (building.towers > 0) {
    updatedPlayer = addTowers(updatedPlayer, building.towers);
  }

  const updatedBoard = removeBuildingFromBoard(board, slotIndex);

  return { updatedBoard, updatedPlayer, building };
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

  const { building, slotIndex } = found;
  if (!canAfford(player, building.cost)) return null;

  const updatedPlayer = removeCoins(player, building.cost);
  const updatedBoard = removeBuildingFromBoard(board, slotIndex);

  return { updatedBoard, updatedPlayer };
};

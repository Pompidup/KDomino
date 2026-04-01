import {
  createBuildersBoard,
  destroyWithDragon,
  findBuildingOnBoard,
  hasOpenConstructionSquare,
  isValidConstructionPosition,
  placeBuildingOnKingdom,
  purchaseBuilding,
  refillBuildersBoard,
  removeBuildingFromBoard,
} from "@core/domain/entities/building.js";
import type {
  BuildersBoard,
  BuildingTile,
} from "@core/domain/types/building.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { describe, expect, it } from "vitest";

const makeTile = (
  id: number,
  cost = 1,
  crowns = 0,
  towers = 0,
): BuildingTile => ({
  id,
  name: `Building ${id}`,
  cost,
  crowns,
  towers,
});

const makePlayer = (coins = 7): Player => ({
  id: "p1",
  name: "Alice",
  kingdom: [],
  coins,
  towers: 0,
  knights: [],
  buildings: [],
});

const noShuffle = <T>(arr: T[]): T[] => [...arr];

describe("building", () => {
  describe("createBuildersBoard", () => {
    it("should create board with 4 visible slots and draw pile", () => {
      const tiles = Array.from({ length: 10 }, (_, i) => makeTile(i + 1));
      const board = createBuildersBoard(tiles, noShuffle);

      expect(board.slots).toHaveLength(4);
      expect(board.drawPile).toHaveLength(6);
    });

    it("should handle fewer than 4 tiles", () => {
      const tiles = [makeTile(1), makeTile(2)];
      const board = createBuildersBoard(tiles, noShuffle);

      expect(board.slots).toHaveLength(2);
      expect(board.drawPile).toHaveLength(0);
    });
  });

  describe("refillBuildersBoard", () => {
    it("should fill empty slots from draw pile", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1), null, makeTile(3), null],
        drawPile: [makeTile(5), makeTile(6)],
      };

      const refilled = refillBuildersBoard(board);
      expect(refilled.slots[1]?.id).toBe(5);
      expect(refilled.slots[3]?.id).toBe(6);
      expect(refilled.drawPile).toHaveLength(0);
    });

    it("should not overfill when draw pile is smaller than empty slots", () => {
      const board: BuildersBoard = {
        slots: [null, null, null, null],
        drawPile: [makeTile(1)],
      };

      const refilled = refillBuildersBoard(board);
      expect(refilled.slots.filter((s) => s !== null)).toHaveLength(1);
      expect(refilled.drawPile).toHaveLength(0);
    });
  });

  describe("findBuildingOnBoard", () => {
    it("should find a building by id", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1), makeTile(2), null, makeTile(4)],
        drawPile: [],
      };

      const found = findBuildingOnBoard(board, 2);
      expect(found).not.toBeNull();
      expect(found?.building.id).toBe(2);
      expect(found?.slotIndex).toBe(1);
    });

    it("should return null for missing building", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1), null, null, null],
        drawPile: [],
      };

      expect(findBuildingOnBoard(board, 99)).toBeNull();
    });
  });

  describe("removeBuildingFromBoard", () => {
    it("should set slot to null", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1), makeTile(2), makeTile(3), makeTile(4)],
        drawPile: [],
      };

      const updated = removeBuildingFromBoard(board, 1);
      expect(updated.slots[1]).toBeNull();
      expect(updated.slots[0]?.id).toBe(1);
    });
  });

  describe("purchaseBuilding", () => {
    it("should purchase a building and deduct coins", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 3, 1, 0), null, null, null],
        drawPile: [],
      };
      const player = makePlayer(7);

      const result = purchaseBuilding(board, player, 1);
      expect(result).not.toBeNull();
      expect(result?.updatedPlayer.coins).toBe(4);
      expect(result?.updatedBoard.slots[0]).toBeNull();
      expect(result?.building.id).toBe(1);
    });

    it("should return null if player cannot afford", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 10), null, null, null],
        drawPile: [],
      };
      const player = makePlayer(5);

      expect(purchaseBuilding(board, player, 1)).toBeNull();
    });

    it("should return null if building not found", () => {
      const board: BuildersBoard = {
        slots: [null, null, null, null],
        drawPile: [],
      };

      expect(purchaseBuilding(board, makePlayer(), 99)).toBeNull();
    });

    it("should apply immediate coin bonus", () => {
      const tile: BuildingTile = {
        ...makeTile(1, 2),
        immediateBonus: { type: "coins", amount: 3 },
      };
      const board: BuildersBoard = {
        slots: [tile, null, null, null],
        drawPile: [],
      };

      const result = purchaseBuilding(board, makePlayer(5), 1);
      // 5 - 2 (cost) + 3 (bonus) = 6
      expect(result?.updatedPlayer.coins).toBe(6);
    });

    it("should add towers from building", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 1, 0, 2), null, null, null],
        drawPile: [],
      };

      const result = purchaseBuilding(board, makePlayer(5), 1);
      expect(result?.updatedPlayer.towers).toBe(2);
    });
  });

  describe("hasOpenConstructionSquare", () => {
    it("should return true when construction square exists", () => {
      const kingdom: Kingdom = [
        [
          { type: "wheat", crowns: 0, hasConstructionSquare: true },
          { type: "empty", crowns: 0 },
        ],
      ];

      expect(hasOpenConstructionSquare(kingdom, [])).toBe(true);
    });

    it("should return false when no construction squares", () => {
      const kingdom: Kingdom = [
        [
          { type: "wheat", crowns: 0 },
          { type: "forest", crowns: 0 },
        ],
      ];

      expect(hasOpenConstructionSquare(kingdom, [])).toBe(false);
    });

    it("should return false when all construction squares occupied", () => {
      const kingdom: Kingdom = [
        [{ type: "wheat", crowns: 0, hasConstructionSquare: true }],
      ];
      const placed = [{ building: makeTile(1), position: { x: 0, y: 0 } }];

      expect(hasOpenConstructionSquare(kingdom, placed)).toBe(false);
    });
  });

  describe("isValidConstructionPosition", () => {
    it("should return true for open construction square", () => {
      const kingdom: Kingdom = [
        [{ type: "wheat", crowns: 0, hasConstructionSquare: true }],
      ];

      expect(isValidConstructionPosition(kingdom, [], { x: 0, y: 0 })).toBe(
        true,
      );
    });

    it("should return false for non-construction tile", () => {
      const kingdom: Kingdom = [[{ type: "wheat", crowns: 0 }]];

      expect(isValidConstructionPosition(kingdom, [], { x: 0, y: 0 })).toBe(
        false,
      );
    });

    it("should return false for occupied position", () => {
      const kingdom: Kingdom = [
        [{ type: "wheat", crowns: 0, hasConstructionSquare: true }],
      ];
      const placed = [{ building: makeTile(1), position: { x: 0, y: 0 } }];

      expect(isValidConstructionPosition(kingdom, placed, { x: 0, y: 0 })).toBe(
        false,
      );
    });
  });

  describe("placeBuildingOnKingdom", () => {
    it("should add building crowns to the tile", () => {
      const kingdom: Kingdom = [
        [{ type: "wheat", crowns: 1, hasConstructionSquare: true }],
      ];
      const building = makeTile(1, 2, 2);

      const updated = placeBuildingOnKingdom(kingdom, building, {
        x: 0,
        y: 0,
      });
      expect(updated[0]![0]!.crowns).toBe(3); // 1 + 2
    });

    it("should not mutate original kingdom", () => {
      const kingdom: Kingdom = [
        [{ type: "wheat", crowns: 0, hasConstructionSquare: true }],
      ];
      const building = makeTile(1, 1, 2);

      placeBuildingOnKingdom(kingdom, building, { x: 0, y: 0 });
      expect(kingdom[0]![0]!.crowns).toBe(0);
    });
  });

  describe("destroyWithDragon", () => {
    it("should destroy building and charge player", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 3), null, null, null],
        drawPile: [],
      };

      const result = destroyWithDragon(board, 1, makePlayer(5));
      expect(result).not.toBeNull();
      expect(result?.updatedPlayer.coins).toBe(2);
      expect(result?.updatedBoard.slots[0]).toBeNull();
    });

    it("should return null if cannot afford", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 10), null, null, null],
        drawPile: [],
      };

      expect(destroyWithDragon(board, 1, makePlayer(5))).toBeNull();
    });

    it("should return null if building not found", () => {
      const board: BuildersBoard = {
        slots: [null, null, null, null],
        drawPile: [],
      };

      expect(destroyWithDragon(board, 99, makePlayer(5))).toBeNull();
    });
  });
});

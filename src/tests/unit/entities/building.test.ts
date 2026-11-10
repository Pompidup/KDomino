import {
  BUILDERS_BOARD_SLOT_COSTS,
  createBuildersBoard,
  destroyWithDragon,
  findBuildingOnBoard,
  getConstructionCost,
  getSlotCost,
  hasOpenConstructionSquare,
  isValidConstructionPosition,
  placeBuildingOnKingdom,
  purchaseBuilding,
  refillBuildersBoard,
  removeBuildingFromBoard,
  startNewQueenDominoRound,
} from "@core/domain/entities/building.js";
import { canPlaceKnight } from "@core/domain/entities/knight.js";
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
    it("should create the official board: 6 spots costing 5 to 0 and a draw pile", () => {
      const tiles = Array.from({ length: 10 }, (_, i) => makeTile(i + 1));
      const board = createBuildersBoard(tiles, noShuffle);

      expect(BUILDERS_BOARD_SLOT_COSTS).toEqual([5, 4, 3, 2, 1, 0]);
      expect(board.slots.map((s) => s?.id)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(board.slotCosts).toEqual([5, 4, 3, 2, 1, 0]);
      expect(board.drawPile.map((t) => t.id)).toEqual([7, 8, 9, 10]);
    });

    it("should leave the missing spots empty with fewer than 6 tiles", () => {
      const tiles = [makeTile(1), makeTile(2)];
      const board = createBuildersBoard(tiles, noShuffle);

      expect(board.slots.map((s) => s?.id ?? null)).toEqual([
        1,
        2,
        null,
        null,
        null,
        null,
      ]);
      expect(board.drawPile).toHaveLength(0);
    });
  });

  describe("refillBuildersBoard (official board: slide then fill)", () => {
    const officialBoard = (
      slots: (BuildingTile | null)[],
      drawPile: BuildingTile[],
    ): BuildersBoard => ({
      slots,
      drawPile,
      slotCosts: [...BUILDERS_BOARD_SLOT_COSTS],
    });

    it("slides the remaining tiles to the cheapest spots, then fills the freed spots", () => {
      const board = officialBoard(
        [makeTile(1), null, makeTile(3), null, makeTile(5), null],
        [makeTile(7), makeTile(8), makeTile(9), makeTile(10)],
      );

      const refilled = refillBuildersBoard(board);
      // 1, 3, 5 keep their order on the 3 cheapest spots (2, 1, 0 coins);
      // the draw pile fills the freed spots, cheapest first
      expect(refilled.slots.map((s) => s?.id)).toEqual([9, 8, 7, 1, 3, 5]);
      expect(refilled.drawPile.map((t) => t.id)).toEqual([10]);
      expect(refilled.slotCosts).toEqual([5, 4, 3, 2, 1, 0]);
    });

    it("leaves the most expensive spots empty once the draw pile is exhausted", () => {
      const board = officialBoard(
        [makeTile(1), null, null, makeTile(4), null, null],
        [makeTile(7)],
      );

      const refilled = refillBuildersBoard(board);
      expect(refilled.slots.map((s) => s?.id ?? null)).toEqual([
        null,
        null,
        null,
        7,
        1,
        4,
      ]);
      expect(refilled.drawPile).toHaveLength(0);
    });

    it("does not mutate the original board", () => {
      const board = officialBoard(
        [null, makeTile(2), null, null, null, null],
        [makeTile(7)],
      );
      refillBuildersBoard(board);
      expect(board.slots[1]?.id).toBe(2);
      expect(board.drawPile).toHaveLength(1);
    });
  });

  describe("getSlotCost / getConstructionCost", () => {
    const board: BuildersBoard = {
      slots: [makeTile(1, 2), null, null, null, makeTile(5, 4), makeTile(6, 3)],
      drawPile: [],
      slotCosts: [...BUILDERS_BOARD_SLOT_COSTS],
    };

    it("prices a building by its spot, not by its own cost", () => {
      expect(getSlotCost(board, 0)).toBe(5);
      expect(getSlotCost(board, 4)).toBe(1);
      expect(getSlotCost(board, 5)).toBe(0);
      expect(getSlotCost(board, 1)).toBeNull();
    });

    it("lowers the price by 1 for the Queen's host, never below 0", () => {
      expect(getConstructionCost(board, 0, true)).toBe(4);
      expect(getConstructionCost(board, 4, true)).toBe(0);
      expect(getConstructionCost(board, 5, true)).toBe(0);
      expect(getConstructionCost(board, 0, false)).toBe(5);
    });

    it("falls back to the tile cost on a legacy board without spot costs", () => {
      const legacy: BuildersBoard = {
        slots: [makeTile(1, 2), null, null, null],
        drawPile: [],
      };
      expect(getSlotCost(legacy, 0)).toBe(2);
      expect(getConstructionCost(legacy, 0, true)).toBe(1);
    });
  });

  describe("refillBuildersBoard (legacy board without spot costs)", () => {
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

    it("should charge the spot price on the official board", () => {
      const board: BuildersBoard = {
        slots: [
          makeTile(1, 1),
          null,
          null,
          makeTile(4, 5),
          null,
          makeTile(6, 5),
        ],
        drawPile: [],
        slotCosts: [...BUILDERS_BOARD_SLOT_COSTS],
      };

      // Tile 1 (own cost 1) sits on the 5-coin spot
      expect(purchaseBuilding(board, makePlayer(4), 1)).toBeNull();
      expect(
        purchaseBuilding(board, makePlayer(5), 1)?.updatedPlayer.coins,
      ).toBe(0);
      // Tile 4 (own cost 5) sits on the 2-coin spot
      const bought = purchaseBuilding(board, makePlayer(2), 4);
      expect(bought?.cost).toBe(2);
      expect(bought?.updatedPlayer.coins).toBe(0);
      // Tile 6 sits on the free spot
      expect(
        purchaseBuilding(board, makePlayer(0), 6)?.updatedPlayer.coins,
      ).toBe(0);
    });

    it("should apply the Queen's 1-coin discount to her host only", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1), null, null, null, makeTile(5), makeTile(6)],
        drawPile: [],
        slotCosts: [...BUILDERS_BOARD_SLOT_COSTS],
      };
      const player = makePlayer(4);

      expect(purchaseBuilding(board, player, 1)).toBeNull();
      expect(purchaseBuilding(board, player, 1, "someone-else")).toBeNull();
      const discounted = purchaseBuilding(board, player, 1, player.id);
      expect(discounted?.cost).toBe(4);
      expect(discounted?.updatedPlayer.coins).toBe(0);
      // The 1-coin spot becomes free, the free spot stays free
      expect(purchaseBuilding(board, player, 5, player.id)?.cost).toBe(0);
      expect(purchaseBuilding(board, player, 6, player.id)?.cost).toBe(0);
    });

    it("should apply immediate tower bonus", () => {
      const tile: BuildingTile = {
        ...makeTile(1, 1, 0, 1),
        immediateBonus: { type: "tower", amount: 2 },
      };
      const board: BuildersBoard = {
        slots: [tile, null, null, null],
        drawPile: [],
      };

      const result = purchaseBuilding(board, makePlayer(5), 1);
      expect(result?.updatedPlayer.towers).toBe(3);
    });

    it("should apply immediate knight bonus by raising the knight limit", () => {
      const tile: BuildingTile = {
        ...makeTile(1, 2),
        immediateBonus: { type: "knight", amount: 1 },
      };
      const board: BuildersBoard = {
        slots: [tile, null, null, null],
        drawPile: [],
      };

      const result = purchaseBuilding(board, makePlayer(5), 1);
      expect(result?.updatedPlayer.bonusKnights).toBe(1);
      expect(result?.updatedPlayer.coins).toBe(3);

      // A player who already placed all their knights can place one more
      const kingdom: Kingdom = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({
          type: "empty" as const,
          crowns: 0 as const,
        })),
      );
      kingdom[0]![0] = { type: "wheat", crowns: 0 };
      kingdom[2]![0] = { type: "forest", crowns: 0 };
      kingdom[4]![0] = { type: "sea", crowns: 0 };
      kingdom[6]![0] = { type: "mine", crowns: 0 };
      const knights = [0, 2, 4].map((y) => ({
        playerId: "p1",
        position: { x: 0, y },
      }));
      // 3 knights placed: the starting one and 2 bonus knights
      const withThreeKnights: Player = {
        ...makePlayer(5),
        kingdom,
        knights,
        bonusKnights: 2,
      };

      expect(canPlaceKnight(withThreeKnights, kingdom, { x: 0, y: 6 })).toBe(
        false,
      );
      expect(
        canPlaceKnight({ ...withThreeKnights, bonusKnights: 3 }, kingdom, {
          x: 0,
          y: 6,
        }),
      ).toBe(true);
    });
  });

  describe("startNewQueenDominoRound", () => {
    it("should refill empty slots and send the Dragon back to its cave", () => {
      const state = {
        buildersBoard: {
          slots: [null, makeTile(2), null, makeTile(4)],
          drawPile: [makeTile(5), makeTile(6), makeTile(7)],
        },
        queenHolderId: null,
        dragonAvailable: true,
        dragonUsedThisRound: true,
      };

      const next = startNewQueenDominoRound(state);
      expect(next.dragonUsedThisRound).toBe(false);
      expect(next.buildersBoard.slots.map((s) => s?.id)).toEqual([5, 2, 6, 4]);
      expect(next.buildersBoard.drawPile.map((t) => t.id)).toEqual([7]);
      // Original state is not mutated
      expect(state.buildersBoard.slots[0]).toBeNull();
    });

    it("should leave slots empty once the draw pile is exhausted", () => {
      const next = startNewQueenDominoRound({
        buildersBoard: { slots: [null, null, makeTile(3), null], drawPile: [] },
        queenHolderId: "p1",
        dragonAvailable: true,
        dragonUsedThisRound: false,
      });
      expect(next.buildersBoard.slots.map((s) => s?.id ?? null)).toEqual([
        null,
        null,
        3,
        null,
      ]);
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
    it("should destroy building and charge the player 1 coin, whatever the building", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 3), makeTile(2, 10), null, null, null, null],
        drawPile: [],
        slotCosts: [...BUILDERS_BOARD_SLOT_COSTS],
      };

      const result = destroyWithDragon(board, 1, makePlayer(5));
      expect(result).not.toBeNull();
      expect(result?.updatedPlayer.coins).toBe(4);
      expect(result?.updatedBoard.slots[0]).toBeNull();
      // The spot stays empty: no immediate refill
      expect(result?.updatedBoard.drawPile).toHaveLength(0);

      expect(
        destroyWithDragon(board, 2, makePlayer(1))?.updatedPlayer.coins,
      ).toBe(0);
    });

    it("should return null if the player has no coin", () => {
      const board: BuildersBoard = {
        slots: [makeTile(1, 10), null, null, null],
        drawPile: [],
      };

      expect(destroyWithDragon(board, 1, makePlayer(0))).toBeNull();
      expect(destroyWithDragon(board, 1, makePlayer(1))).not.toBeNull();
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

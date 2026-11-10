import {
  getMaxKnights,
  STARTING_KNIGHTS,
} from "@core/domain/entities/economy.js";
import {
  calculateKnightTax,
  canPlaceKnight,
  countConstructionSquaresInTerritory,
  countTerritorySquares,
  placeKnight,
} from "@core/domain/entities/knight.js";
import { GRIDSIZE } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { describe, expect, it } from "vitest";

const emptyKingdom = () =>
  Array.from({ length: GRIDSIZE }, () =>
    Array.from({ length: GRIDSIZE }, () => ({
      type: "empty" as const,
      crowns: 0 as const,
    })),
  );

const makePlayer = (knightCount = 0): Player => {
  const knights = Array.from({ length: knightCount }, (_, i) => ({
    playerId: "p1",
    position: { x: i, y: 0 },
  }));
  return {
    id: "p1",
    name: "Alice",
    kingdom: emptyKingdom(),
    coins: 7,
    towers: 0,
    knights,
    buildings: [],
  };
};

describe("knight", () => {
  describe("countConstructionSquaresInTerritory", () => {
    it("should count construction squares in a territory", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = {
        type: "wheat",
        crowns: 0,
        hasConstructionSquare: true,
      };
      kingdom[4]![6] = {
        type: "wheat",
        crowns: 1,
        hasConstructionSquare: true,
      };
      kingdom[4]![7] = { type: "wheat", crowns: 0 };

      const count = countConstructionSquaresInTerritory(kingdom, {
        x: 5,
        y: 4,
      });
      expect(count).toBe(2);
    });

    it("should not count across different terrain types", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = {
        type: "wheat",
        crowns: 0,
        hasConstructionSquare: true,
      };
      kingdom[4]![6] = {
        type: "forest",
        crowns: 0,
        hasConstructionSquare: true,
      };

      const count = countConstructionSquaresInTerritory(kingdom, {
        x: 5,
        y: 4,
      });
      expect(count).toBe(1);
    });

    it("should return 0 for empty tile", () => {
      const kingdom = emptyKingdom();
      expect(countConstructionSquaresInTerritory(kingdom, { x: 0, y: 0 })).toBe(
        0,
      );
    });
  });

  describe("canPlaceKnight", () => {
    it("should allow placing a knight on a valid tile", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };
      const player = makePlayer(0);
      player.kingdom = kingdom;

      expect(canPlaceKnight(player, kingdom, { x: 5, y: 4 })).toBe(true);
    });

    it("starts with a single knight (official rule)", () => {
      expect(STARTING_KNIGHTS).toBe(1);
      expect(getMaxKnights(makePlayer(0))).toBe(1);
      expect(getMaxKnights({ ...makePlayer(0), bonusKnights: 2 })).toBe(3);
    });

    it("should reject when every knight of the player is placed", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };

      // The starting knight is already placed elsewhere
      const player: Player = {
        ...makePlayer(0),
        kingdom,
        knights: [{ playerId: "p1", position: { x: 1, y: 1 } }],
      };

      expect(canPlaceKnight(player, kingdom, { x: 5, y: 4 })).toBe(false);
    });

    it("should accept a knight granted by a building bonus", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };

      const player: Player = {
        ...makePlayer(0),
        kingdom,
        bonusKnights: 1,
        knights: [{ playerId: "p1", position: { x: 1, y: 1 } }],
      };

      expect(canPlaceKnight(player, kingdom, { x: 5, y: 4 })).toBe(true);
    });

    it("should reject placing on empty tile", () => {
      const kingdom = emptyKingdom();
      const player = makePlayer(0);

      expect(canPlaceKnight(player, kingdom, { x: 0, y: 0 })).toBe(false);
    });

    it("should reject placing on castle", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      const player = makePlayer(0);

      expect(canPlaceKnight(player, kingdom, { x: 4, y: 4 })).toBe(false);
    });

    it("should accept a territory where a knight already is (official rule)", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };
      kingdom[4]![6] = { type: "wheat", crowns: 0 };

      const player: Player = {
        ...makePlayer(0),
        kingdom,
        bonusKnights: 1,
        knights: [{ playerId: "p1", position: { x: 5, y: 4 } }],
      };

      // x:6,y:4 is the same wheat territory as x:5,y:4
      expect(canPlaceKnight(player, kingdom, { x: 6, y: 4 })).toBe(true);
    });

    it("should reject a square that already holds a knight", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };

      const player: Player = {
        ...makePlayer(0),
        kingdom,
        bonusKnights: 1,
        knights: [{ playerId: "p1", position: { x: 5, y: 4 } }],
      };

      expect(canPlaceKnight(player, kingdom, { x: 5, y: 4 })).toBe(false);
    });
  });

  describe("canPlaceKnight with allowed positions (domino just placed)", () => {
    const buildKingdom = () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      // Older domino
      kingdom[4]![5] = { type: "wheat", crowns: 0 };
      kingdom[4]![6] = { type: "forest", crowns: 0 };
      // Domino just placed
      kingdom[5]![4] = { type: "sea", crowns: 0 };
      kingdom[6]![4] = { type: "mine", crowns: 1 };
      return kingdom;
    };
    const justPlaced = [
      { x: 4, y: 5 },
      { x: 4, y: 6 },
    ];

    it("should allow both squares of the domino just placed", () => {
      const kingdom = buildKingdom();
      const player = { ...makePlayer(), kingdom };
      expect(canPlaceKnight(player, kingdom, { x: 4, y: 5 }, justPlaced)).toBe(
        true,
      );
      expect(canPlaceKnight(player, kingdom, { x: 4, y: 6 }, justPlaced)).toBe(
        true,
      );
    });

    it("should reject a square of an older domino", () => {
      const kingdom = buildKingdom();
      const player = { ...makePlayer(), kingdom };
      expect(canPlaceKnight(player, kingdom, { x: 5, y: 4 }, justPlaced)).toBe(
        false,
      );
    });

    it("should accept the second square once the first holds a knight (2 knights per turn)", () => {
      const kingdom = buildKingdom();
      const player: Player = {
        ...makePlayer(),
        kingdom,
        bonusKnights: 1,
        knights: [{ playerId: "p1", position: { x: 4, y: 5 } }],
      };
      expect(canPlaceKnight(player, kingdom, { x: 4, y: 5 }, justPlaced)).toBe(
        false,
      );
      expect(canPlaceKnight(player, kingdom, { x: 4, y: 6 }, justPlaced)).toBe(
        true,
      );
    });

    it("should reject everything when no domino was just placed", () => {
      const kingdom = buildKingdom();
      const player = { ...makePlayer(), kingdom };
      expect(canPlaceKnight(player, kingdom, { x: 4, y: 5 }, [])).toBe(false);
    });
  });

  describe("countTerritorySquares / calculateKnightTax", () => {
    const kingdom = () => {
      const k = emptyKingdom();
      k[4]![4] = { type: "castle", crowns: 0 };
      k[4]![5] = { type: "wheat", crowns: 0, hasConstructionSquare: true };
      k[4]![6] = { type: "wheat", crowns: 1 };
      k[5]![6] = { type: "wheat", crowns: 0 };
      k[3]![5] = { type: "forest", crowns: 0 };
      return k;
    };

    it("counts every square of the territory, construction square or not", () => {
      expect(countTerritorySquares(kingdom(), { x: 5, y: 4 })).toBe(3);
      expect(calculateKnightTax(kingdom(), { x: 6, y: 5 })).toBe(3);
      expect(calculateKnightTax(kingdom(), { x: 5, y: 3 })).toBe(1);
    });

    it("is 0 on an empty square or the castle", () => {
      expect(countTerritorySquares(kingdom(), { x: 0, y: 0 })).toBe(0);
      expect(countTerritorySquares(kingdom(), { x: 4, y: 4 })).toBe(0);
    });
  });

  describe("placeKnight", () => {
    it("should add knight and collect 1 coin per square of the territory", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = {
        type: "wheat",
        crowns: 0,
        hasConstructionSquare: true,
      };
      kingdom[4]![6] = { type: "wheat", crowns: 0 };
      kingdom[4]![7] = { type: "wheat", crowns: 1 };

      const player = makePlayer(0);
      player.coins = 7;

      const updated = placeKnight(player, kingdom, { x: 5, y: 4 });
      expect(updated.knights).toHaveLength(1);
      expect(updated.knights?.[0]?.position).toEqual({ x: 5, y: 4 });
      // 3 squares in the territory (official rule) = 3 coins earned
      expect(updated.coins).toBe(10);
    });

    it("should not mutate original player", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![5] = { type: "wheat", crowns: 0 };
      const player = makePlayer(0);
      player.coins = 7;

      placeKnight(player, kingdom, { x: 5, y: 4 });
      expect(player.knights).toHaveLength(0);
      expect(player.coins).toBe(7);
    });
  });
});

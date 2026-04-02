import {
  canPlaceKnight,
  countConstructionSquaresInTerritory,
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

    it("should reject when max knights reached", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };

      // Create player with 3 knights in different territories
      const player: Player = {
        ...makePlayer(0),
        kingdom,
        knights: [
          { playerId: "p1", position: { x: 1, y: 1 } },
          { playerId: "p1", position: { x: 2, y: 2 } },
          { playerId: "p1", position: { x: 3, y: 3 } },
        ],
      };

      expect(canPlaceKnight(player, kingdom, { x: 5, y: 4 })).toBe(false);
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

    it("should reject if territory already has a knight", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };
      kingdom[4]![6] = { type: "wheat", crowns: 0 };

      const player: Player = {
        ...makePlayer(0),
        kingdom,
        knights: [{ playerId: "p1", position: { x: 5, y: 4 } }],
      };

      // x:6,y:4 is same wheat territory as x:5,y:4
      expect(canPlaceKnight(player, kingdom, { x: 6, y: 4 })).toBe(false);
    });
  });

  describe("placeKnight", () => {
    it("should add knight and collect tax", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = {
        type: "wheat",
        crowns: 0,
        hasConstructionSquare: true,
      };
      kingdom[4]![6] = {
        type: "wheat",
        crowns: 0,
        hasConstructionSquare: true,
      };

      const player = makePlayer(0);
      player.coins = 7;

      const updated = placeKnight(player, kingdom, { x: 5, y: 4 });
      expect(updated.knights).toHaveLength(1);
      expect(updated.knights?.[0]?.position).toEqual({ x: 5, y: 4 });
      // 2 construction squares in territory = 2 coins earned
      expect(updated.coins).toBe(9);
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

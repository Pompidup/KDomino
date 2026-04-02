import {
  calculateBuildingEndGameBonus,
  determineQueenHolder,
  getQueenBonus,
} from "@core/domain/entities/queen.js";
import type { PlacedBuilding } from "@core/domain/types/building.js";
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

const makePlayer = (
  id: string,
  towers = 0,
  buildings: PlacedBuilding[] = [],
): Player => ({
  id,
  name: `Player ${id}`,
  kingdom: emptyKingdom(),
  coins: 0,
  towers,
  knights: [],
  buildings,
});

describe("queen", () => {
  describe("determineQueenHolder", () => {
    it("should give Queen to player with most towers", () => {
      const players = [makePlayer("p1", 2), makePlayer("p2", 3)];
      expect(determineQueenHolder(players, null)).toBe("p2");
    });

    it("should not move Queen on tie", () => {
      const players = [makePlayer("p1", 2), makePlayer("p2", 2)];
      expect(determineQueenHolder(players, "p1")).toBe("p1");
    });

    it("should not move Queen when no one has towers", () => {
      const players = [makePlayer("p1", 0), makePlayer("p2", 0)];
      expect(determineQueenHolder(players, null)).toBeNull();
    });

    it("should assign Queen when one player gets first tower", () => {
      const players = [makePlayer("p1", 1), makePlayer("p2", 0)];
      expect(determineQueenHolder(players, null)).toBe("p1");
    });
  });

  describe("getQueenBonus", () => {
    it("should return size of territory with most crowns", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      // 3-tile wheat territory with 2 crowns total
      kingdom[4]![5] = { type: "wheat", crowns: 1 };
      kingdom[4]![6] = { type: "wheat", crowns: 1 };
      kingdom[4]![7] = { type: "wheat", crowns: 0 };
      // 2-tile forest territory with 1 crown
      kingdom[5]![4] = { type: "forest", crowns: 1 };
      kingdom[5]![5] = { type: "forest", crowns: 0 };

      // Queen goes to wheat (2 crowns > 1 crown)
      // Bonus = size of that territory = 3
      expect(getQueenBonus(kingdom)).toBe(3);
    });

    it("should return 0 for empty kingdom", () => {
      expect(getQueenBonus(emptyKingdom())).toBe(0);
    });

    it("should return 0 when no crowns exist", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };

      expect(getQueenBonus(kingdom)).toBe(0);
    });
  });

  describe("calculateBuildingEndGameBonus", () => {
    it("should calculate flat bonus", () => {
      const player = makePlayer("p1", 0, [
        {
          building: {
            id: 1,
            name: "Fort",
            cost: 5,
            crowns: 0,
            towers: 0,
            endGameScoring: { type: "flat", points: 6 },
          },
          position: { x: 5, y: 4 },
        },
      ]);

      expect(calculateBuildingEndGameBonus(player)).toBe(6);
    });

    it("should calculate perBuilding bonus", () => {
      const buildings: PlacedBuilding[] = [
        {
          building: {
            id: 1,
            name: "Church",
            cost: 4,
            crowns: 0,
            towers: 0,
            endGameScoring: { type: "perBuilding", points: 2 },
          },
          position: { x: 5, y: 4 },
        },
        {
          building: {
            id: 2,
            name: "Bakery",
            cost: 1,
            crowns: 0,
            towers: 0,
          },
          position: { x: 6, y: 4 },
        },
      ];
      const player = makePlayer("p1", 0, buildings);

      // 2 buildings * 2 points = 4
      expect(calculateBuildingEndGameBonus(player)).toBe(4);
    });

    it("should calculate perTower bonus", () => {
      const player: Player = {
        ...makePlayer("p1", 3, [
          {
            building: {
              id: 1,
              name: "Fountain",
              cost: 3,
              crowns: 0,
              towers: 0,
              endGameScoring: { type: "perTower", points: 2 },
            },
            position: { x: 5, y: 4 },
          },
        ]),
      };

      // 3 towers * 2 points = 6
      expect(calculateBuildingEndGameBonus(player)).toBe(6);
    });

    it("should calculate perTerrain bonus", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "sea", crowns: 0 };
      kingdom[4]![6] = { type: "sea", crowns: 1 };
      kingdom[5]![5] = { type: "sea", crowns: 0 };

      const player: Player = {
        ...makePlayer("p1", 0, [
          {
            building: {
              id: 1,
              name: "Harbour",
              cost: 3,
              crowns: 0,
              towers: 0,
              endGameScoring: {
                type: "perTerrain",
                terrain: "sea",
                points: 2,
              },
            },
            position: { x: 5, y: 4 },
          },
        ]),
        kingdom,
      };

      // 3 sea tiles * 2 points = 6
      expect(calculateBuildingEndGameBonus(player)).toBe(6);
    });

    it("should return 0 with no buildings", () => {
      expect(calculateBuildingEndGameBonus(makePlayer("p1"))).toBe(0);
    });

    it("should sum multiple building bonuses", () => {
      const buildings: PlacedBuilding[] = [
        {
          building: {
            id: 1,
            name: "Fort",
            cost: 5,
            crowns: 0,
            towers: 0,
            endGameScoring: { type: "flat", points: 6 },
          },
          position: { x: 5, y: 4 },
        },
        {
          building: {
            id: 2,
            name: "Guard",
            cost: 1,
            crowns: 0,
            towers: 0,
            endGameScoring: { type: "flat", points: 2 },
          },
          position: { x: 6, y: 4 },
        },
      ];

      expect(
        calculateBuildingEndGameBonus(makePlayer("p1", 0, buildings)),
      ).toBe(8);
    });
  });
});

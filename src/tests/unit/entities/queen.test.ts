import {
  calculateBuildingEndGameBonus,
  calculateQueenDominoEndGameBonus,
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

    describe("with the acting player (official rule: even on a tie)", () => {
      it("gives the Queen to the player who reaches a tie", () => {
        const players = [makePlayer("p1", 2), makePlayer("p2", 2)];
        expect(determineQueenHolder(players, "p1", "p2")).toBe("p2");
      });

      it("gives the Queen to the player who gets strictly the most towers", () => {
        const players = [makePlayer("p1", 2), makePlayer("p2", 3)];
        expect(determineQueenHolder(players, "p1", "p2")).toBe("p2");
      });

      it("keeps the Queen with her host while the acting player has fewer towers", () => {
        const players = [
          makePlayer("p1", 3),
          makePlayer("p2", 2),
          makePlayer("p3", 3),
        ];
        expect(determineQueenHolder(players, "p1", "p2")).toBe("p1");
      });

      it("keeps the Queen with her host when the host builds", () => {
        const players = [makePlayer("p1", 3), makePlayer("p2", 2)];
        expect(determineQueenHolder(players, "p1", "p1")).toBe("p1");
      });

      it("nobody hosts the Queen without a tower", () => {
        const players = [makePlayer("p1", 0), makePlayer("p2", 0)];
        expect(determineQueenHolder(players, null, "p1")).toBeNull();
      });

      it("the first tower of the game brings the Queen", () => {
        const players = [makePlayer("p1", 0), makePlayer("p2", 1)];
        expect(determineQueenHolder(players, null, "p2")).toBe("p2");
      });
    });
  });

  describe("getQueenBonus", () => {
    it("should return size of the largest territory", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      // 3-tile wheat territory with 2 crowns total
      kingdom[4]![5] = { type: "wheat", crowns: 1 };
      kingdom[4]![6] = { type: "wheat", crowns: 1 };
      kingdom[4]![7] = { type: "wheat", crowns: 0 };
      // 2-tile forest territory with 1 crown
      kingdom[5]![4] = { type: "forest", crowns: 1 };
      kingdom[5]![5] = { type: "forest", crowns: 0 };

      // Queen goes to the largest territory (wheat, 3 squares)
      // Bonus = size of that territory = 3
      expect(getQueenBonus(kingdom)).toBe(3);
    });

    it("should pick the largest territory, not the one with the most crowns", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      // 4-square forest territory with 0 crowns
      kingdom[3]![4] = { type: "forest", crowns: 0 };
      kingdom[2]![4] = { type: "forest", crowns: 0 };
      kingdom[1]![4] = { type: "forest", crowns: 0 };
      kingdom[1]![5] = { type: "forest", crowns: 0 };
      // 2-square mine territory with 3 crowns
      kingdom[4]![5] = { type: "mine", crowns: 3 };
      kingdom[4]![6] = { type: "mine", crowns: 0 };

      // Official rule: the Queen goes on the largest territory where she
      // counts as a crown: forest 4 squares x 1 crown = +4
      expect(getQueenBonus(kingdom)).toBe(4);
    });

    it("should return 0 for empty kingdom", () => {
      expect(getQueenBonus(emptyKingdom())).toBe(0);
    });

    it("should still count the Queen as a crown when no crowns exist", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 0 };

      expect(getQueenBonus(kingdom)).toBe(1);
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

    it("should calculate perCrown bonus, ignoring crowns covered by giants", () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "mine", crowns: 2 };
      kingdom[4]![6] = { type: "wheat", crowns: 1 };
      const player: Player = {
        ...makePlayer("p1", 0, [
          {
            building: {
              id: 7,
              name: "The Magic School",
              cost: 4,
              crowns: 0,
              towers: 0,
              endGameScoring: { type: "perCrown", points: 1 },
            },
            position: { x: 6, y: 4 },
          },
        ]),
        kingdom,
      };

      expect(calculateBuildingEndGameBonus(player)).toBe(3);
      expect(
        calculateBuildingEndGameBonus({
          ...player,
          giants: [{ position: { x: 5, y: 4 } }],
        }),
      ).toBe(2);
    });
  });

  describe("calculateQueenDominoEndGameBonus", () => {
    const buildKingdom = () => {
      const kingdom = emptyKingdom();
      kingdom[4]![4] = { type: "castle", crowns: 0 };
      kingdom[4]![5] = { type: "wheat", crowns: 1 };
      kingdom[4]![6] = { type: "wheat", crowns: 0 };
      kingdom[4]![7] = { type: "wheat", crowns: 0 };
      return kingdom;
    };
    const guardTower: PlacedBuilding = {
      building: {
        id: 11,
        name: "The Guard Tower",
        cost: 1,
        crowns: 0,
        towers: 1,
        endGameScoring: { type: "flat", points: 2 },
      },
      position: { x: 6, y: 4 },
    };

    it("should add the Queen bonus for the Queen holder", () => {
      const player = {
        ...makePlayer("p1", 1, [guardTower]),
        kingdom: buildKingdom(),
      };
      // Queen: largest territory (3 squares) + Guard Tower flat 2
      expect(calculateQueenDominoEndGameBonus(player, "p1")).toBe(5);
    });

    it("should add 1 point per 3 unused coins (Wealth)", () => {
      const player = {
        ...makePlayer("p1", 1, [guardTower]),
        kingdom: buildKingdom(),
        coins: 11,
      };
      // Guard Tower flat 2 + 11 coins / 3 = 3
      expect(calculateQueenDominoEndGameBonus(player, null)).toBe(5);
    });

    it("should not add the Queen bonus for other players", () => {
      const player = {
        ...makePlayer("p1", 1, [guardTower]),
        kingdom: buildKingdom(),
      };
      expect(calculateQueenDominoEndGameBonus(player, "p2")).toBe(2);
      expect(calculateQueenDominoEndGameBonus(player, null)).toBe(2);
    });
  });
});

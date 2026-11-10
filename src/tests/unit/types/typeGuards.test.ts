import {
  type CavemanTile,
  cavemanKinds,
  type GameWithResults,
  isGameWithNextAction,
  isGameWithNextStep,
  isGameWithResults,
  isHunterGathererTile,
  isWarriorTile,
} from "@core/domain/types/index.js";
import { describe, expect, test } from "vitest";
import cavemen from "../../../datasources/cavemen.json" with { type: "json" };
import * as publicApi from "../../../index.js";
import { createGameBuilder } from "../../builder/game.js";

describe("type guards", () => {
  describe("isGameWithResults", () => {
    test("returns false for a game without results", () => {
      const game = createGameBuilder().withAllDefaults().build();

      expect(isGameWithResults(game)).toBe(false);
    });

    test("returns true for a game carrying a result array", () => {
      const game = createGameBuilder()
        .withAllDefaults()
        .withNextAction({ type: "step", step: "result" })
        .build();
      const gameWithResults: GameWithResults = {
        ...game,
        result: [
          {
            playerId: "player1-id",
            playerName: "player1",
            position: 1,
            details: { points: 10, maxPropertiesSize: 4, totalCrowns: 2 },
          },
        ],
      };

      expect(isGameWithResults(gameWithResults)).toBe(true);
      if (isGameWithResults(gameWithResults)) {
        expect(gameWithResults.result[0]?.position).toBe(1);
      }
    });

    test("returns false when result is not an array", () => {
      const game = {
        ...createGameBuilder().build(),
        result: null,
      } as unknown as GameWithResults;

      expect(isGameWithResults(game)).toBe(false);
    });

    test("is independent from isGameWithNextAction / isGameWithNextStep", () => {
      const game = createGameBuilder()
        .withNextAction({ type: "step", step: "result" })
        .build();

      expect(isGameWithNextStep(game)).toBe(true);
      expect(isGameWithNextAction(game)).toBe(false);
      expect(isGameWithResults(game)).toBe(false);
    });
  });

  describe("CavemanTile guards", () => {
    const hunter: CavemanTile = {
      kind: "hunterGatherer",
      id: 1,
      hunterType: "mammothHunter",
      pointsPerMatch: 3,
    };
    const warrior: CavemanTile = {
      kind: "warrior",
      id: 2,
      warriorType: "amazon",
      power: 2,
    };

    test("isHunterGathererTile narrows hunter-gatherers", () => {
      expect(isHunterGathererTile(hunter)).toBe(true);
      expect(isHunterGathererTile(warrior)).toBe(false);
      if (isHunterGathererTile(hunter)) {
        expect(hunter.hunterType).toBe("mammothHunter");
      }
    });

    test("isWarriorTile narrows warriors", () => {
      expect(isWarriorTile(warrior)).toBe(true);
      expect(isWarriorTile(hunter)).toBe(false);
      if (isWarriorTile(warrior)) {
        expect(warrior.power).toBe(2);
      }
    });

    test("every caveman of the datasource matches exactly one guard", () => {
      const tiles = cavemen as CavemanTile[];
      expect(tiles.length).toBeGreaterThan(0);
      for (const tile of tiles) {
        expect(Object.values(cavemanKinds)).toContain(tile.kind);
        expect(isHunterGathererTile(tile) !== isWarriorTile(tile)).toBe(true);
      }
    });
  });

  describe("public API", () => {
    test("exports the type guards and discriminants", () => {
      expect(publicApi.isGameWithResults).toBe(isGameWithResults);
      expect(publicApi.isHunterGathererTile).toBe(isHunterGathererTile);
      expect(publicApi.isWarriorTile).toBe(isWarriorTile);
      expect(publicApi.cavemanKinds).toEqual({
        hunterGatherer: "hunterGatherer",
        warrior: "warrior",
      });
    });
  });
});

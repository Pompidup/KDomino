import jsonQuestTiles from "@adapter/jsonQuestTiles";
import { questTypes } from "@core/domain/types/ageOfGiants.js";
import { describe, expect, test } from "vitest";

describe("jsonQuestTiles", () => {
  test("should return all 17 quest tiles", () => {
    const repository = jsonQuestTiles();
    const tiles = repository.getAll();

    expect(tiles).toHaveLength(17);
  });

  test("should have valid quest tile structure", () => {
    const repository = jsonQuestTiles();
    const tiles = repository.getAll();
    const validTypes = Object.values(questTypes);

    for (const tile of tiles) {
      expect(tile.id).toBeTypeOf("number");
      expect(tile.name).toBeTypeOf("string");
      expect(tile.description).toBeTypeOf("string");
      expect(tile.points).toBeGreaterThan(0);
      expect(validTypes).toContain(tile.type);
    }
  });

  test("should have unique quest tile ids", () => {
    const repository = jsonQuestTiles();
    const tiles = repository.getAll();
    const ids = tiles.map((t) => t.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(tiles.length);
  });

  test("should have terrain-based quests with terrain field", () => {
    const repository = jsonQuestTiles();
    const tiles = repository.getAll();
    const terrainQuests = tiles.filter(
      (t) => t.type === questTypes.localTrade || t.type === questTypes.kingdomBorders,
    );

    expect(terrainQuests.length).toBe(8); // 4 localTrade + 4 kingdomBorders
    for (const quest of terrainQuests) {
      expect(quest.terrain).toBeDefined();
    }
  });

  test("should have non-terrain quests without terrain field", () => {
    const repository = jsonQuestTiles();
    const tiles = repository.getAll();
    const nonTerrainQuests = tiles.filter(
      (t) => t.type !== questTypes.localTrade && t.type !== questTypes.kingdomBorders,
    );

    for (const quest of nonTerrainQuests) {
      expect(quest.terrain).toBeUndefined();
    }
  });

  test("should return a new array each time (immutability)", () => {
    const repository = jsonQuestTiles();
    const tiles1 = repository.getAll();
    const tiles2 = repository.getAll();

    expect(tiles1).not.toBe(tiles2);
    expect(tiles1).toEqual(tiles2);
  });
});

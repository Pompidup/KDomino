import jsonBuildings from "@adapter/jsonBuildings";
import { describe, expect, test } from "vitest";

describe("jsonBuildings", () => {
  test("should return all building tiles", () => {
    const repository = jsonBuildings();
    const buildings = repository.getAll();

    expect(buildings).toHaveLength(18);
  });

  test("should have valid building structure", () => {
    const repository = jsonBuildings();
    const buildings = repository.getAll();

    for (const building of buildings) {
      expect(building.id).toBeTypeOf("number");
      expect(building.name).toBeTypeOf("string");
      expect(building.cost).toBeGreaterThanOrEqual(0);
      expect(building.crowns).toBeGreaterThanOrEqual(0);
      expect(building.towers).toBeGreaterThanOrEqual(0);
    }
  });

  test("should have unique building ids", () => {
    const repository = jsonBuildings();
    const buildings = repository.getAll();
    const ids = buildings.map((b) => b.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(buildings.length);
  });

  test("should have some buildings with immediate bonuses", () => {
    const repository = jsonBuildings();
    const buildings = repository.getAll();
    const withBonus = buildings.filter((b) => b.immediateBonus);

    expect(withBonus.length).toBeGreaterThan(0);
  });

  test("should have some buildings with end-game scoring", () => {
    const repository = jsonBuildings();
    const buildings = repository.getAll();
    const withScoring = buildings.filter((b) => b.endGameScoring);

    expect(withScoring.length).toBeGreaterThan(0);
  });

  test("should have some buildings with towers", () => {
    const repository = jsonBuildings();
    const buildings = repository.getAll();
    const withTowers = buildings.filter((b) => b.towers > 0);

    expect(withTowers.length).toBeGreaterThan(0);
  });
});

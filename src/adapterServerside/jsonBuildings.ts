import type {
  BuildingTile,
  EndGameScoring,
  EndGameScoringType,
  ImmediateBonus,
  ImmediateBonusType,
} from "@core/domain/types/building.js";
import type { BuildingsRepository } from "@core/portServerside/buildingsRepository.js";
import buildingsJson from "../datasources/buildings.json" with { type: "json" };

const jsonBuildings = (): BuildingsRepository => {
  const buildings: BuildingTile[] = buildingsJson.map((b) => {
    const tile: BuildingTile = {
      id: b.id,
      name: b.name,
      cost: b.cost,
      crowns: b.crowns,
      towers: b.towers,
    };

    if (b.immediateBonus) {
      tile.immediateBonus = {
        type: b.immediateBonus.type as ImmediateBonusType,
        amount: b.immediateBonus.amount,
      } satisfies ImmediateBonus;
    }

    if ("endGameScoring" in b && b.endGameScoring) {
      tile.endGameScoring = {
        type: b.endGameScoring.type as EndGameScoringType,
        points: b.endGameScoring.points,
        ...("terrain" in b.endGameScoring && {
          terrain: b.endGameScoring.terrain,
        }),
      } satisfies EndGameScoring;
    }

    return tile;
  });

  return {
    getAll: () => buildings,
  };
};

export default jsonBuildings;

import type { BuildingTile } from "@core/domain/types/building.js";

export type BuildingsRepository = {
  getAll: () => BuildingTile[];
};

import type { CavemanTile } from "@core/domain/types/origins.js";

export type CavemenRepository = {
  getAll: () => CavemanTile[];
};

import type { QuestTile } from "@core/domain/types/ageOfGiants.js";

export type QuestTilesRepository = {
  getAll: () => QuestTile[];
};

import type { QuestTile, QuestType } from "@core/domain/types/ageOfGiants.js";
import type { Ground } from "@core/domain/types/domino.js";
import type { QuestTilesRepository } from "@core/portServerside/questTilesRepository.js";
import questTilesJson from "../datasources/questTiles.json" with {
  type: "json",
};

const mapQuestTile = (raw: {
  id: number;
  type: string;
  name: string;
  description: string;
  points: number;
  terrain?: string;
}): QuestTile => {
  const tile: QuestTile = {
    id: raw.id,
    type: raw.type as QuestType,
    name: raw.name,
    description: raw.description,
    points: raw.points,
  };
  if (raw.terrain) {
    tile.terrain = raw.terrain as Ground;
  }
  return tile;
};

const jsonQuestTiles = (): QuestTilesRepository => {
  const questTiles: QuestTile[] = questTilesJson.map(mapQuestTile);

  return {
    getAll: () => [...questTiles],
  };
};

export default jsonQuestTiles;

import type { Domino, Ground, Tile } from "@core/domain/types/domino.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import dominoesJson from "../datasources/dominoes.json" with { type: "json" };

const mapTile = (raw: {
  type: string;
  crowns: number;
  hasConstructionSquare?: boolean;
  volcanoCraters?: number;
}): Tile => {
  const tile: Tile = {
    type: raw.type as Ground,
    crowns: raw.crowns,
  };
  if (raw.hasConstructionSquare) {
    tile.hasConstructionSquare = true;
  }
  if (raw.volcanoCraters) {
    tile.volcanoCraters = raw.volcanoCraters;
  }
  return tile;
};

/** Maps Origins sub-mode names to the shared domino data key */
const ORIGINS_MODE_PREFIX = "KingdominoOrigins";
const resolveDataKey = (modeName: string): string => {
  if (modeName.startsWith(ORIGINS_MODE_PREFIX)) {
    return ORIGINS_MODE_PREFIX;
  }
  return modeName;
};

const jsonDominoes = (): DominoesRepository => {
  const dominoes: Record<string, Domino[]> = {};

  for (const [key, value] of Object.entries(dominoesJson)) {
    const currentDominoes: Domino[] = [];
    value.forEach((domino) => {
      currentDominoes.push({
        left: mapTile(domino.left),
        right: mapTile(domino.right),
        number: domino.number,
      });
    });

    dominoes[key] = currentDominoes;
  }

  return {
    getForMode: (mode: GameMode) => {
      const key = resolveDataKey(mode.name);
      return dominoes[key] || [];
    },
  };
};

export default jsonDominoes;

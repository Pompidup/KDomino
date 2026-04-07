import {
  createEmptyKingdom,
  placeCastle,
  placeTile,
} from "@core/domain/entities/kingdom.js";
import type { Domino, Tile } from "@core/domain/types/index.js";
import { getValidPlacementsUseCase } from "@core/useCases/getValidPlacements.js";
import { describe, expect, test } from "vitest";

const forest: Tile = { type: "forest", crowns: 0 };
const plain: Tile = { type: "plain", crowns: 0 };
const plainForestDomino: Domino = { left: plain, right: forest, number: 3 };

describe("getValidPlacementsUseCase", () => {
  test("should not return placements where only mismatched halves touch existing tiles (bug repro)", () => {
    // Kingdom: castle@(4,4), forest@(4,2), forest@(4,3)
    // Domino plain/forest — placements (5,2) rot 0 and (4,1) rot 0 are illegal:
    // the plain half touches forest, the forest half touches nothing.
    let kingdom = placeCastle(createEmptyKingdom());
    kingdom = placeTile(kingdom, { x: 4, y: 2 }, forest);
    kingdom = placeTile(kingdom, { x: 4, y: 3 }, forest);

    const placements = getValidPlacementsUseCase(kingdom, plainForestDomino);

    const hasIllegal52 = placements.some(
      (p) => p.position.x === 5 && p.position.y === 2 && p.rotation === 0,
    );
    const hasIllegal41 = placements.some(
      (p) => p.position.x === 4 && p.position.y === 1 && p.rotation === 0,
    );

    expect(hasIllegal52).toBe(false);
    expect(hasIllegal41).toBe(false);
  });
});

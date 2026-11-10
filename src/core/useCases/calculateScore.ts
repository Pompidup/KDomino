import { computeTerritories } from "@core/domain/entities/scoreBreakdown.js";
import type { Kingdom, Position, Score } from "@core/domain/types/index.js";
import { ok, type Result } from "@utils/result.js";

export type CalculateScoreUseCase = (
  kingdom: Kingdom,
  giantPositions?: Position[],
) => Result<Score>;

/**
 * Territory score of a kingdom (no mode bonus). Uses the same territory
 * computation as the mode-aware score breakdown (`calculatePlayerScore`).
 */
export const calculateScoreUseCase: CalculateScoreUseCase = (
  kingdom,
  giantPositions,
) => {
  const territories = computeTerritories(kingdom, giantPositions);

  let points = 0;
  let maxPropertiesSize = 0;
  let totalCrowns = 0;

  for (const territory of territories) {
    points += territory.points;
    maxPropertiesSize = Math.max(maxPropertiesSize, territory.cells.length);
    totalCrowns += territory.crowns;
  }

  return ok({
    points,
    maxPropertiesSize,
    totalCrowns,
  });
};

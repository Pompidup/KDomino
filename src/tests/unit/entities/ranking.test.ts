import {
  compareScores,
  firstDifferingCriterion,
  getTiebreakCriteria,
  KINGDOMINO_TIEBREAK_CRITERIA,
  QUEENDOMINO_TIEBREAK_CRITERIA,
} from "@core/domain/entities/ranking.js";
import { describe, expect, test } from "vitest";

describe("ranking", () => {
  test.each([
    ["Classic", KINGDOMINO_TIEBREAK_CRITERIA],
    ["AgeOfGiants", KINGDOMINO_TIEBREAK_CRITERIA],
    ["KingdominoOrigins-Discovery", KINGDOMINO_TIEBREAK_CRITERIA],
    ["KingdominoOrigins-Totem", KINGDOMINO_TIEBREAK_CRITERIA],
    ["KingdominoOrigins-Tribe", KINGDOMINO_TIEBREAK_CRITERIA],
    ["QueenDomino", QUEENDOMINO_TIEBREAK_CRITERIA],
    ["AgeOfGiants-QueenDomino", QUEENDOMINO_TIEBREAK_CRITERIA],
  ])("%s tie-break criteria", (mode, criteria) => {
    expect(getTiebreakCriteria(mode)).toEqual(criteria);
  });

  test("Kingdomino compares the largest territory, then the crowns", () => {
    expect(KINGDOMINO_TIEBREAK_CRITERIA).toEqual([
      "largestTerritory",
      "crowns",
    ]);
    expect(QUEENDOMINO_TIEBREAK_CRITERIA).toEqual(["largestTerritory"]);
  });

  test("compareScores orders by points, then by each criterion", () => {
    const base = { points: 10, maxPropertiesSize: 3, totalCrowns: 2 };
    const criteria = KINGDOMINO_TIEBREAK_CRITERIA;

    expect(compareScores(base, { ...base, points: 9 }, criteria)).toBeLessThan(
      0,
    );
    expect(
      compareScores(base, { ...base, maxPropertiesSize: 4 }, criteria),
    ).toBeGreaterThan(0);
    expect(
      compareScores(base, { ...base, totalCrowns: 1 }, criteria),
    ).toBeLessThan(0);
    expect(compareScores(base, { ...base }, criteria)).toBe(0);
    // Crowns are ignored by the Queendomino criteria
    expect(
      compareScores(
        base,
        { ...base, totalCrowns: 9 },
        QUEENDOMINO_TIEBREAK_CRITERIA,
      ),
    ).toBe(0);
  });

  test("firstDifferingCriterion returns the separating criterion index or -1", () => {
    const base = { points: 10, maxPropertiesSize: 3, totalCrowns: 2 };
    const criteria = KINGDOMINO_TIEBREAK_CRITERIA;

    expect(
      firstDifferingCriterion(
        base,
        { ...base, maxPropertiesSize: 1 },
        criteria,
      ),
    ).toBe(0);
    expect(
      firstDifferingCriterion(base, { ...base, totalCrowns: 5 }, criteria),
    ).toBe(1);
    expect(firstDifferingCriterion(base, base, criteria)).toBe(-1);
  });
});

import type { Score } from "./scoring.js";

export type ScoreResult = {
  playerId: string;
  playerName: string;
  details: Score;
};

export type FinalResult = ScoreResult & {
  position: number;
};

const result = (scores: ScoreResult[]): FinalResult[] => {
  // 1 order players by score, then by maxPropertiesSize, then by totalCrowns all descending
  scores.sort((a, b) => {
    if (a.details.score !== b.details.score) {
      return b.details.score - a.details.score;
    }
    if (a.details.maxPropertiesSize !== b.details.maxPropertiesSize) {
      return b.details.maxPropertiesSize - a.details.maxPropertiesSize;
    }
    return b.details.totalCrowns - a.details.totalCrowns;
  });

  const result: FinalResult[] = [];
  let isTie = false;
  result.push({
    ...scores[0]!,
    position: 1,
  });

  for (let i = 1; i < scores.length; i++) {
    const currentScore = scores[i];
    const previousScore = scores[i - 1];
    if (
      previousScore &&
      currentScore &&
      currentScore.details.score === previousScore.details.score &&
      currentScore.details.maxPropertiesSize ===
        previousScore.details.maxPropertiesSize &&
      currentScore.details.totalCrowns === previousScore.details.totalCrowns
    ) {
      isTie = true;
    }

    if (isTie) {
      result.push({
        ...currentScore!,
        position: result[i - 1]!.position,
      });
    } else {
      result.push({
        ...currentScore!,
        position: i + 1,
      });
    }

    isTie = false;
  }

  return result;
};

export { result };

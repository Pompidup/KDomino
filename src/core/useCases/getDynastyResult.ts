import type { GameWithResults } from "@core/domain/types/index.js";

export type DynastyResult = {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPoints: number[];
  position: number;
};

export type GetDynastyResultUseCase = (
  games: GameWithResults[],
) => DynastyResult[];

export const getDynastyResultUseCase: GetDynastyResultUseCase = (games) => {
  // Collect all unique players
  const playerMap = new Map<string, { name: string; points: number[] }>();

  for (const game of games) {
    for (const result of game.result) {
      const existing = playerMap.get(result.playerId);
      if (existing) {
        existing.points.push(result.details.points);
      } else {
        playerMap.set(result.playerId, {
          name: result.playerName,
          points: [result.details.points],
        });
      }
    }
  }

  // Calculate totals and sort
  const results: Omit<DynastyResult, "position">[] = [];
  for (const [playerId, data] of playerMap) {
    results.push({
      playerId,
      playerName: data.name,
      totalPoints: data.points.reduce((sum, p) => sum + p, 0),
      gamesPoints: data.points,
    });
  }

  results.sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign positions with tie detection
  const finalResults: DynastyResult[] = [];
  for (let i = 0; i < results.length; i++) {
    const current = results[i]!;
    const previous = i > 0 ? finalResults[i - 1]! : null;
    const position =
      previous && current.totalPoints === previous.totalPoints
        ? previous.position
        : i + 1;
    finalResults.push({ ...current, position });
  }

  return finalResults;
};

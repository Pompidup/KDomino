import type {
  FinalResult,
  GameWithNextStep,
  GameWithResults,
  ScoreResult,
} from "../domain/types/index.js";
import { ok, type Result } from "../../utils/result.js";
import {
  checkCastleIsInMiddle,
  countDominoes,
} from "../domain/entities/kingdom.js";

type Property = {
  type: string;
  crowns: number;
  size: number;
  tiles: number[][];
};

export type GetResultUseCase = (
  game: GameWithNextStep
) => Result<GameWithResults>;

export const getResultUseCase: GetResultUseCase = (game) => {
  const { players, rules } = game;
  const { basic, extra } = rules;
  const scores: ScoreResult[] = players.map((player) => {
    const { kingdom } = player;
    const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
    const properties: Property[] = [];

    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // Up, Down, Left, Right

    const markZone = (
      x: number,
      y: number,
      type: string,
      crowns: number
    ): void => {
      if (
        x < 0 ||
        y < 0 ||
        x >= kingdom[0]!.length ||
        y >= kingdom.length ||
        visited[y]![x] ||
        kingdom[y]![x]!.type !== type ||
        kingdom[y]![x]!.type === "empty" ||
        kingdom[y]![x]!.type === "castle"
      ) {
        return;
      }

      visited[y]![x] = true;
      const currentZone = properties.find(
        (property) =>
          property.type === type &&
          property.tiles.some(([tx, ty]) => {
            for (let [dx, dy] of directions) {
              if (
                (tx as number) + (dx as number) === x &&
                (ty as number) + (dy as number) === y
              ) {
                return true;
              }
            }
            return false;
          })
      );

      if (currentZone) {
        currentZone.size += 1;
        currentZone.tiles.push([x, y]);
        currentZone.crowns += crowns;
      } else {
        properties.push({
          type,
          crowns,
          size: 1,
          tiles: [[x, y]],
        });
      }

      directions.forEach(([dx, dy]) => {
        const nx = x + (dx as number);
        const ny = y + (dy as number);
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < kingdom[0]!.length &&
          ny < kingdom.length &&
          kingdom[ny]![nx]!.type === type
        ) {
          markZone(nx, ny, kingdom[ny]![nx]!.type, kingdom[ny]![nx]!.crowns);
        }
      });
    };

    kingdom.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (!visited[y]![x]) {
          markZone(x, y, tile.type, tile.crowns);
        }
      });
    });

    if (properties.length === 0) {
      return {
        playerId: player.id,
        playerName: player.name,
        details: {
          points: 0,
          maxPropertiesSize: 0,
          totalCrowns: 0,
        },
      };
    }

    let points = properties.reduce(
      (score, property) => score + property.crowns * property.size,
      0
    );
    const maxPropertiesSize = Math.max(
      ...properties.map((property) => property.size ?? 0)
    );

    const totalCrowns = properties.reduce(
      (total, property) => total + property.crowns,
      0
    );

    if (extra.length > 0) {
      extra.forEach((extraRule) => {
        if (extraRule.name === "The middle Kingdom") {
          const castleIsInMiddle = checkCastleIsInMiddle(kingdom);
          if (castleIsInMiddle) {
            points += 10;
          }
        }

        if (extraRule.name === "Harmony") {
          const totalDominoes = countDominoes(kingdom);
          const dominoLimit = basic.maxDominoes;
          const totalPlayers = players.length;
          const dominoesPerPlayer = dominoLimit / totalPlayers;
          if (totalDominoes === dominoesPerPlayer) {
            points += 5;
          }
        }
      });
    }

    return {
      playerId: player.id,
      playerName: player.name,
      details: {
        points,
        maxPropertiesSize,
        totalCrowns,
      },
    };
  });

  // 1 order players by score, then by maxPropertiesSize, then by totalCrowns all descending
  scores.sort((a, b) => {
    if (a.details.points !== b.details.points) {
      return b.details.points - a.details.points;
    }
    if (a.details.maxPropertiesSize !== b.details.maxPropertiesSize) {
      return b.details.maxPropertiesSize - a.details.maxPropertiesSize;
    }
    return b.details.totalCrowns - a.details.totalCrowns;
  });

  const result: FinalResult[] = [];

  let isTie = false;
  result.push({
    playerId: scores[0]!.playerId,
    playerName: scores[0]!.playerName,
    details: scores[0]!.details,
    position: 1,
  });

  for (let i = 1; i < scores.length; i++) {
    const currentScore = scores[i];
    const previousScore = scores[i - 1];
    if (
      previousScore &&
      currentScore &&
      currentScore.details.points === previousScore.details.points &&
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

  return ok({
    ...game,
    result: result,
  });
};

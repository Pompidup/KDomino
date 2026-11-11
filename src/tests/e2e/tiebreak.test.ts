/**
 * End-of-game tie-break (GitHub #31), per the official rules of each mode:
 * - Kingdomino (Classic), Age of Giants and Kingdomino Origins: largest
 *   territory, then most crowns (Origins: fire symbols), then shared;
 * - Queendomino and Age of Giants + Queendomino: largest territory, then
 *   shared.
 *
 * Every mode starts a real game, then its kingdoms are replaced by crafted
 * ones with the same points (no mode bonus) before `getResults`.
 */
import type { Ground } from "@core/domain/types/domino.js";
import type {
  FinalResult,
  GameState,
  GameWithNextStep,
} from "@core/domain/types/game.js";
import { GRIDSIZE, type Kingdom } from "@core/domain/types/kingdom.js";
import { tiebreakCriteria } from "@core/domain/types/score.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const engine = createGameEngine({});

type Square = { x: number; type: Ground; crowns: number };

/** A 9x9 kingdom with the castle in the centre and squares on its row. */
const kingdomOf = (squares: Square[]): Kingdom => {
  const center = Math.floor(GRIDSIZE / 2);
  const kingdom: Kingdom = Array.from({ length: GRIDSIZE }, () =>
    Array.from({ length: GRIDSIZE }, () => ({
      type: "empty" as const,
      crowns: 0,
    })),
  );
  kingdom[center]![center] = { type: "castle", crowns: 0 };
  for (const { x, type, crowns } of squares) {
    kingdom[center]![x] = { type, crowns };
  }
  return kingdom;
};

/*
 * Every crafted kingdom but Dave's scores 6 points:
 * - Alice: wheat ×3, 2 crowns            → largest 3, crowns 2
 * - Bobby: wheat ×3 (1 crown) + sea ×1 (3 crowns) → largest 3, crowns 4
 * - Carol: wheat ×2 (3 crowns) + forest ×1        → largest 2, crowns 3
 * - Dave: castle only                    → 0 points
 */
const KINGDOMS: Record<string, Kingdom> = {
  Alice: kingdomOf([
    { x: 5, type: "wheat", crowns: 1 },
    { x: 6, type: "wheat", crowns: 1 },
    { x: 7, type: "wheat", crowns: 0 },
  ]),
  Bobby: kingdomOf([
    { x: 5, type: "wheat", crowns: 1 },
    { x: 6, type: "wheat", crowns: 0 },
    { x: 7, type: "wheat", crowns: 0 },
    { x: 3, type: "sea", crowns: 3 },
  ]),
  Carol: kingdomOf([
    { x: 5, type: "wheat", crowns: 3 },
    { x: 6, type: "wheat", crowns: 0 },
    { x: 3, type: "forest", crowns: 0 },
  ]),
  Dave: kingdomOf([]),
};

/** A real game of `mode`, ended with the crafted kingdoms and no bonus. */
const endedGame = (mode: string): GameWithNextStep => {
  let game: GameState = engine.createGame({ mode, seed: `tiebreak-${mode}` });
  game = engine.addPlayers({ game, players: Object.keys(KINGDOMS) });
  const started = engine.startGame({ game });
  return {
    ...started,
    rules: { ...started.rules, extra: [] },
    ...(started.ageOfGiants && {
      ageOfGiants: { ...started.ageOfGiants, questTiles: [] },
    }),
    ...(started.queendomino && {
      queendomino: { ...started.queendomino, queenHolderId: null },
    }),
    players: started.players.map((player) => ({
      ...player,
      kingdom: KINGDOMS[player.name]!,
      ...(player.coins !== undefined && { coins: 0 }),
      buildings: [],
      knights: [],
      fireTokens: [],
      resources: [],
      cavemen: [],
      giants: [],
    })),
    nextAction: { type: "step", step: "result" },
  };
};

const ranking = (results: FinalResult[]) =>
  results.map((r) => ({
    name: r.playerName,
    position: r.position,
    tiebreaker: r.tiebreaker,
    tied: r.tied,
  }));

describe("End-of-game tie-break", () => {
  test.each([
    "Classic",
    "AgeOfGiants",
    "KingdominoOrigins-Discovery",
    "KingdominoOrigins-Totem",
    "KingdominoOrigins-Tribe",
  ])("%s: largest territory, then crowns, then shared", (mode) => {
    const { result } = engine.getResults({ game: endedGame(mode) });

    expect(result.map((r) => r.details.points)).toEqual([6, 6, 6, 0]);
    expect(ranking(result)).toEqual([
      // Bobby and Alice: same largest territory, Bobby has more crowns
      {
        name: "Bobby",
        position: 1,
        tiebreaker: tiebreakCriteria.crowns,
        tied: false,
      },
      {
        name: "Alice",
        position: 2,
        tiebreaker: tiebreakCriteria.crowns,
        tied: false,
      },
      // Carol: smaller largest territory, crowns not needed
      {
        name: "Carol",
        position: 3,
        tiebreaker: tiebreakCriteria.largestTerritory,
        tied: false,
      },
      // Dave: nobody else has his points
      { name: "Dave", position: 4, tiebreaker: null, tied: false },
    ]);
  });

  test.each([
    "QueenDomino",
    "AgeOfGiants-QueenDomino",
  ])("%s: largest territory, then shared (no crowns criterion)", (mode) => {
    const { result } = engine.getResults({ game: endedGame(mode) });

    expect(result.map((r) => r.details.points)).toEqual([6, 6, 6, 0]);
    const [first, second, ...others] = ranking(result);
    // Alice and Bobby share the victory despite Bobby's extra crowns
    expect([first, second].map((r) => r!.name).sort()).toEqual([
      "Alice",
      "Bobby",
    ]);
    for (const shared of [first, second]) {
      expect(shared).toMatchObject({
        position: 1,
        tiebreaker: tiebreakCriteria.largestTerritory,
        tied: true,
      });
    }
    expect(others).toEqual([
      {
        name: "Carol",
        position: 3,
        tiebreaker: tiebreakCriteria.largestTerritory,
        tied: false,
      },
      { name: "Dave", position: 4, tiebreaker: null, tied: false },
    ]);
  });

  test("Classic: equal on points, largest territory and crowns share the position", () => {
    const game = endedGame("Classic");
    const alice = game.players.find((p) => p.name === "Alice")!;
    const twins: GameWithNextStep = {
      ...game,
      players: game.players.map((p) =>
        p.name === "Bobby" ? { ...p, kingdom: alice.kingdom } : p,
      ),
    };

    const { result } = engine.getResults({ game: twins });
    expect(ranking(result).slice(0, 2)).toEqual([
      {
        name: "Alice",
        position: 1,
        tiebreaker: tiebreakCriteria.crowns,
        tied: true,
      },
      {
        name: "Bobby",
        position: 1,
        tiebreaker: tiebreakCriteria.crowns,
        tied: true,
      },
    ]);
    expect(result[2]).toMatchObject({ playerName: "Carol", position: 3 });
  });

  test("Origins: the fire tokens count as fire symbols", () => {
    const game = endedGame("KingdominoOrigins-Discovery");
    const center = Math.floor(GRIDSIZE / 2);
    // Alice: wheat x3 without fire, forest x1 (1 printed fire + a 2-fire
    // token) and sea x1 (a 3-fire token): 6 points, 1 printed fire symbol but
    // 6 fire symbols with the tokens (Bobby: 4)
    const withTokens: GameWithNextStep = {
      ...game,
      players: game.players.map((p) => {
        if (p.name !== "Alice") return p;
        const kingdom = kingdomOf([
          { x: 5, type: "wheat", crowns: 0 },
          { x: 6, type: "wheat", crowns: 0 },
          { x: 7, type: "wheat", crowns: 0 },
          { x: 3, type: "forest", crowns: 1 },
          { x: 2, type: "sea", crowns: 0 },
        ]);
        return {
          ...p,
          kingdom,
          fireTokens: [
            { fires: 2 as const, position: { x: 3, y: center } },
            { fires: 3 as const, position: { x: 2, y: center } },
          ],
        };
      }),
    };

    const { result } = engine.getResults({ game: withTokens });
    const alice = result.find((r) => r.playerName === "Alice")!;
    expect(alice.details).toMatchObject({
      points: 6,
      maxPropertiesSize: 3,
      totalCrowns: 1,
      fireSymbols: 6,
    });
    expect(ranking(result).slice(0, 2)).toEqual([
      {
        name: "Alice",
        position: 1,
        tiebreaker: tiebreakCriteria.crowns,
        tied: false,
      },
      {
        name: "Bobby",
        position: 2,
        tiebreaker: tiebreakCriteria.crowns,
        tied: false,
      },
    ]);
  });

  test("Age of Giants: crowns covered by a giant do not break the tie", () => {
    const game = endedGame("AgeOfGiants");
    // Alice gets 3 single-square territories with 1 crown each, all covered
    // by giants: no point, 5 crowns on the tiles but only 2 counted
    const center = Math.floor(GRIDSIZE / 2);
    const extra = [
      { x: 3, type: "forest" as const },
      { x: 2, type: "sea" as const },
      { x: 1, type: "forest" as const },
    ];
    const covered: GameWithNextStep = {
      ...game,
      players: game.players.map((p) => {
        if (p.name !== "Alice") return p;
        const kingdom = p.kingdom.map((row) =>
          row.map((tile) => ({ ...tile })),
        );
        for (const { x, type } of extra)
          kingdom[center]![x] = { type, crowns: 1 };
        return {
          ...p,
          kingdom,
          giants: extra.map(({ x }) => ({ position: { x, y: center } })),
        };
      }),
    };

    const { result } = engine.getResults({ game: covered });
    const alice = result.find((r) => r.playerName === "Alice")!;
    expect(alice.details).toMatchObject({ points: 6, totalCrowns: 2 });
    // Bobby (4 crowns counted) still ranks before Alice (2 counted, 5 printed)
    expect(ranking(result).slice(0, 2)).toEqual([
      {
        name: "Bobby",
        position: 1,
        tiebreaker: tiebreakCriteria.crowns,
        tied: false,
      },
      {
        name: "Alice",
        position: 2,
        tiebreaker: tiebreakCriteria.crowns,
        tied: false,
      },
    ]);
  });
});

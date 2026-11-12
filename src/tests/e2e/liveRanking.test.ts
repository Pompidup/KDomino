/**
 * Live ranking (GitHub #41): `getLiveRanking` ranks the players at any stage
 * of the game with the ranking code of `getResults` (points, then the
 * tie-break criteria of the mode, shared positions), on the scores of
 * `calculatePlayerScore` (live during the game, final once it is over).
 */
import type { Ground } from "@core/domain/types/domino.js";
import type {
  FinalResult,
  GameState,
  GameWithNextAction,
} from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { GRIDSIZE, type Kingdom } from "@core/domain/types/kingdom.js";
import { tiebreakCriteria } from "@core/domain/types/score.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { describe, expect, test } from "vitest";
import {
  createGameEngine,
  wrapWithActionLog,
  wrapWithDebug,
  wrapWithEvents,
} from "../../index.js";
import {
  playSeededGame,
  SEEDS,
  scenarioName,
  scenarios,
} from "./seededGameDriver.js";

const engine = createGameEngine({});

const MODES = [
  "Classic",
  "QueenDomino",
  "KingdominoOrigins-Discovery",
  "KingdominoOrigins-Totem",
  "KingdominoOrigins-Tribe",
  "AgeOfGiants",
  "AgeOfGiants-QueenDomino",
];

const QUEENDOMINO_MODES = ["QueenDomino", "AgeOfGiants-QueenDomino"];

/** getLiveRanking agrees with calculatePlayerScore for every player. */
const expectConsistentWithPlayerScores = (
  engine: GameEngine,
  game: GameState,
) => {
  const ranking = engine.getLiveRanking({ game });
  expect(ranking).toHaveLength(game.players.length);

  for (const [index, entry] of ranking.entries()) {
    const score = engine.calculatePlayerScore({
      game,
      playerId: entry.playerId,
    });
    expect(entry.playerName).toBe(score.playerName);
    expect(entry.breakdown).toEqual(score.breakdown);
    expect(entry.details).toEqual({
      points: score.points,
      maxPropertiesSize: score.maxPropertiesSize,
      totalCrowns: score.totalCrowns,
      ...(score.fireSymbols !== undefined && {
        fireSymbols: score.fireSymbols,
      }),
    });

    // Sorted by points; positions never go back, a shared position is a tie
    const previous = ranking[index - 1];
    if (previous) {
      expect(previous.details.points).toBeGreaterThanOrEqual(
        entry.details.points,
      );
      expect(previous.position).toBeLessThanOrEqual(entry.position);
      if (previous.position === entry.position) {
        expect(previous.tied && entry.tied).toBe(true);
      }
    } else {
      expect(entry.position).toBe(1);
    }
    expect(entry.tiebreaker === null).toBe(
      ranking.every(
        (other) =>
          other === entry || other.details.points !== entry.details.points,
      ),
    );
  }
};

describe("getLiveRanking on seeded games", () => {
  test("the scenarios cover the 7 modes", () => {
    expect(new Set(scenarios.map((s) => s.mode))).toEqual(new Set(MODES));
  });

  for (const scenario of scenarios) {
    test(`${scenarioName(scenario)}: live at every step, identical to getResults at the end`, () => {
      for (const seed of SEEDS) {
        // Every step of the first seed is checked against the live scores
        const onStep =
          seed === SEEDS[0] ? expectConsistentWithPlayerScores : undefined;
        const { engine, game } = playSeededGame(scenario, seed, onStep);
        const results = engine.getResults({ game });

        expect(engine.getLiveRanking({ game })).toEqual(results.result);
        // The state returned by getResults is ranked the same way
        expect(engine.getLiveRanking({ game: results })).toEqual(
          results.result,
        );
        for (const entry of results.result) {
          for (const bonus of entry.breakdown?.bonuses ?? []) {
            expect(bonus.provisional).toBe(false);
          }
        }
      }
    });
  }
});

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

/**
 * A game of `mode` in progress (a few dominoes picked), whose kingdoms are
 * replaced by the crafted ones, with no mode bonus.
 */
const gameInProgress = (
  mode: string,
  extraRules: string[] = [],
): GameWithNextAction => {
  let game: GameState = engine.createGame({ mode, seed: `live-${mode}` });
  game = engine.addPlayers({ game, players: Object.keys(KINGDOMS) });
  if (extraRules.length > 0) {
    game = engine.addExtraRules({ game, extraRules });
  }
  let started: GameState = engine.startGame({ game });
  // Pick two dominoes: an intermediate step of the game
  for (
    let i = 0;
    i < 2 &&
    isGameWithNextAction(started) &&
    started.nextAction.nextAction === "pickDomino";
    i++
  ) {
    const [pick] = engine.getValidDominoPicks({ game: started });
    started = engine.chooseDomino({
      game: started,
      lordId: started.nextAction.nextLord,
      dominoPick: pick!,
    });
  }
  if (!isGameWithNextAction(started)) throw new Error("Game not in progress");
  return {
    ...started,
    rules: {
      ...started.rules,
      extra: started.rules.extra.filter((r) => extraRules.includes(r.name)),
    },
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
  };
};

const ranking = (results: FinalResult[]) =>
  results.map((r) => ({
    name: r.playerName,
    position: r.position,
    tiebreaker: r.tiebreaker,
    tied: r.tied,
  }));

describe("getLiveRanking tie-breaks during the game", () => {
  test.each(
    MODES.filter((mode) => !QUEENDOMINO_MODES.includes(mode)),
  )("%s: largest territory, then crowns, then shared", (mode) => {
    const game = gameInProgress(mode);
    const result = engine.getLiveRanking({ game });

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
    // Live scores: every bonus is provisional
    for (const entry of result) {
      for (const bonus of entry.breakdown?.bonuses ?? []) {
        expect(bonus.provisional).toBe(true);
      }
    }
  });

  test.each(
    QUEENDOMINO_MODES,
  )("%s: largest territory, then shared (no crowns criterion)", (mode) => {
    const result = engine.getLiveRanking({ game: gameInProgress(mode) });

    expect(result.map((r) => r.details.points)).toEqual([6, 6, 6, 0]);
    const [first, second, ...others] = ranking(result);
    // Alice and Bobby share position 1 despite Bobby's extra crowns
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
    const game = gameInProgress("Classic");
    const alice = game.players.find((p) => p.name === "Alice")!;
    const twins: GameWithNextAction = {
      ...game,
      players: game.players.map((p) =>
        p.name === "Bobby" ? { ...p, kingdom: alice.kingdom } : p,
      ),
    };

    const result = engine.getLiveRanking({ game: twins });
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
    const game = gameInProgress("KingdominoOrigins-Discovery");
    const center = Math.floor(GRIDSIZE / 2);
    // Alice: 6 points, 1 printed fire symbol but 6 with the tokens (Bobby: 4)
    const withTokens: GameWithNextAction = {
      ...game,
      players: game.players.map((p) => {
        if (p.name !== "Alice") return p;
        return {
          ...p,
          kingdom: kingdomOf([
            { x: 5, type: "wheat", crowns: 0 },
            { x: 6, type: "wheat", crowns: 0 },
            { x: 7, type: "wheat", crowns: 0 },
            { x: 3, type: "forest", crowns: 1 },
            { x: 2, type: "sea", crowns: 0 },
          ]),
          fireTokens: [
            { fires: 2 as const, position: { x: 3, y: center } },
            { fires: 3 as const, position: { x: 2, y: center } },
          ],
        };
      }),
    };

    const result = engine.getLiveRanking({ game: withTokens });
    expect(result[0]!.details).toMatchObject({
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

  test("provisional bonuses count: Harmony while still reachable", () => {
    const game = gameInProgress("Classic", ["Harmony"]);
    // Alice and Bobby: wheat ×2 with 1 crown (2 points), but Bobby has
    // discarded a domino: Harmony is out of his reach. Carol and Dave: castle
    // only, Harmony still reachable.
    const small = kingdomOf([
      { x: 5, type: "wheat", crowns: 1 },
      { x: 6, type: "wheat", crowns: 0 },
    ]);
    const empty = kingdomOf([]);
    const discarded: GameWithNextAction = {
      ...game,
      players: game.players.map((p) => ({
        ...p,
        kingdom: p.name === "Alice" || p.name === "Bobby" ? small : empty,
        ...(p.name === "Bobby" && { discardedDominoes: 1 }),
      })),
    };

    const result = engine.getLiveRanking({ game: discarded });
    expect(
      result.map((r) => ({
        name: r.playerName,
        points: r.details.points,
        position: r.position,
        tied: r.tied,
      })),
    ).toEqual([
      // 2 + 5 provisional Harmony
      { name: "Alice", points: 7, position: 1, tied: false },
      // 0 + 5 provisional Harmony: shared position
      { name: "Carol", points: 5, position: 2, tied: true },
      { name: "Dave", points: 5, position: 2, tied: true },
      // No Harmony for Bobby: behind the castle-only kingdoms
      { name: "Bobby", points: 2, position: 4, tied: false },
    ]);
    expect(result[0]!.breakdown?.bonuses).toEqual([
      expect.objectContaining({
        type: "harmony",
        points: 5,
        provisional: true,
      }),
    ]);
  });
});

describe("getLiveRanking before startGame", () => {
  test("without players: empty ranking", () => {
    const game = engine.createGame({ mode: "Classic" });
    expect(engine.getLiveRanking({ game })).toEqual([]);
  });

  test.each(MODES)("%s: every player shares position 1", (mode) => {
    let game: GameState = engine.createGame({ mode, seed: "before-start" });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby", "Carol"] });

    const result = engine.getLiveRanking({ game });
    expect(result).toHaveLength(3);
    // Identical kingdoms (castle only): the same live score for everyone
    const { points } = engine.calculatePlayerScore({
      game,
      playerId: game.players[0]!.id,
    });
    if (mode === "Classic") expect(points).toBe(0);
    if (mode === "QueenDomino") expect(points).toBe(2); // Wealth of 7 coins
    for (const entry of result) {
      expect(entry).toMatchObject({
        position: 1,
        tied: true,
        tiebreaker: QUEENDOMINO_MODES.includes(mode)
          ? tiebreakCriteria.largestTerritory
          : tiebreakCriteria.crowns,
        details: { points, maxPropertiesSize: 0, totalCrowns: 0 },
      });
    }
  });

  test("options step: the provisional bonuses of the options count", () => {
    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
    game = engine.addExtraRules({
      game,
      extraRules: ["The middle Kingdom", "Harmony"],
    });

    const result = engine.getLiveRanking({ game });
    expect(result.map((r) => [r.position, r.details.points, r.tied])).toEqual([
      [1, 15, true],
      [1, 15, true],
    ]);
  });

  test("solo: position 1, no tie-break", () => {
    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice"] });

    expect(engine.getLiveRanking({ game })).toMatchObject([
      { playerName: "Alice", position: 1, tiebreaker: null, tied: false },
    ]);
  });
});

describe("getLiveRanking through the wrappers", () => {
  test("events, action log and debug wrappers pass it through", () => {
    let game: GameState = engine.createGame({ mode: "Classic", seed: "wrap" });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
    game = engine.startGame({ game });
    const expected = engine.getLiveRanking({ game });

    const debugLogs: string[] = [];
    const wrapped = [
      wrapWithEvents(engine, {}),
      wrapWithActionLog(engine).engine,
      wrapWithDebug(engine, {
        logger: { log: (entry) => debugLogs.push(entry.method) },
      }),
    ];
    for (const wrapper of wrapped) {
      expect(wrapper.getLiveRanking({ game })).toEqual(expected);
    }
    expect(debugLogs).toContain("getLiveRanking");
  });
});

import { isValidConstructionPosition } from "@core/domain/entities/building.js";
import { isValidCavemanPosition } from "@core/domain/entities/caveman.js";
import { getValidFireTokenPositions } from "@core/domain/entities/fireToken.js";
import { findCrownsNotCoveredByGiants } from "@core/domain/entities/giant.js";
import { canPlaceKnight } from "@core/domain/entities/knight.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { greedyStrategy, playBotTurn } from "@core/useCases/bot.js";
import {
  type ActionType,
  type GameActionLog,
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

/**
 * Deterministic simulation of complete games in every mode. Optional actions
 * are played whenever possible (instead of skipped like the bots do), so that
 * the action log contains every extension action, then the log is replayed on
 * a fresh engine (with its own random uuids) and compared to the original.
 */

type Scenario = {
  mode: string;
  seed?: string;
  players: (string | { id: string; name: string })[];
  extraRules?: string[];
  /** Play optional actions (true) or skip them all (false) */
  playOptional: boolean;
};

type Stats = Partial<Record<ActionType, number>> & {
  pendingGiantPlacements: number;
};

const lordOwner = (game: GameWithNextAction, lordId: string) => {
  const lord = game.lords.find((l) => l.id === lordId);
  const player = game.players.find((p) => p.id === lord?.playerId);
  if (!lord || !player) throw new Error(`Unknown lord ${lordId}`);
  return { lord, player };
};

const gridPositions = (size: number) => {
  const positions: { x: number; y: number }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) positions.push({ x, y });
  }
  return positions;
};

/**
 * Tries to play the current optional action. Returns undefined when it cannot
 * be played (the caller then skips it).
 */
const tryOptionalAction = (
  engine: GameEngine,
  game: GameWithNextAction,
  counter: number,
): GameState | undefined => {
  const lordId = game.nextAction.nextLord;
  const action = game.nextAction.nextAction;
  const { player } = lordOwner(game, lordId);

  switch (action) {
    case playerActions.placeKnight: {
      const allowed = game.queendomino?.lastPlacedPositions ?? [];
      const position = allowed.find((p) =>
        canPlaceKnight(player, player.kingdom, p, allowed),
      );
      return position
        ? engine.placeKnight({ game, lordId, position })
        : undefined;
    }
    case playerActions.constructBuilding: {
      const board = game.queendomino?.buildersBoard;
      const building = board?.slots.find(
        (b) => b !== null && b.cost <= (player.coins ?? 0),
      );
      if (!building) return undefined;
      const position = gridPositions(player.kingdom.length).find((p) =>
        isValidConstructionPosition(player.kingdom, player.buildings ?? [], p),
      );
      return position
        ? engine.constructBuilding({
            game,
            lordId,
            buildingId: building.id,
            position,
          })
        : undefined;
    }
    case playerActions.useDragon: {
      const qd = game.queendomino;
      if (
        !qd?.dragonAvailable ||
        qd.dragonUsedThisRound ||
        qd.queenHolderId === player.id ||
        (player.coins ?? 0) < 1
      ) {
        return undefined;
      }
      const building = qd.buildersBoard.slots.find((b) => b !== null);
      if (!building) return undefined;
      try {
        return engine.useDragon({ game, lordId, buildingId: building.id });
      } catch {
        return undefined;
      }
    }
    case playerActions.placeFireToken: {
      const pending = game.origins?.pendingFireToken;
      if (!pending) return undefined;
      const positions = getValidFireTokenPositions(
        player.kingdom,
        pending.volcanoPosition,
        pending.fires,
        player.fireTokens ?? [],
      );
      const position = positions[counter % Math.max(positions.length, 1)];
      return position
        ? engine.placeFireToken({ game, lordId, position })
        : undefined;
    }
    case playerActions.recruitCaveman: {
      const resources = player.resources ?? [];
      const first = resources[0];
      const second = resources.find((r) => r.type !== first?.type);
      const caveman = game.origins?.caveBoard?.visible[0];
      if (!first || !second || !caveman) return undefined;
      const position = gridPositions(player.kingdom.length).find((p) =>
        isValidCavemanPosition(
          player.kingdom,
          p,
          player.fireTokens ?? [],
          resources,
          player.cavemen ?? [],
        ),
      );
      return position
        ? engine.recruitCaveman({
            game,
            lordId,
            cavemanId: caveman.id,
            position,
            resourcePositions: [first.position, second.position],
          })
        : undefined;
    }
    case playerActions.sendGiant: {
      if ((player.giants ?? []).length === 0) return undefined;
      // Target the opponent with the most free crowns, so that it has a
      // choice to make (pendingGiant)
      const target = game.players
        .filter((p) => p.id !== player.id)
        .map((p) => ({
          p,
          free: findCrownsNotCoveredByGiants(p.kingdom, p.giants ?? []),
        }))
        .filter(({ free }) => free.length > 0)
        .sort((a, b) => b.free.length - a.free.length)[0];
      if (!target) return undefined;
      // Alternate between letting the engine/opponent choose the crown
      // (pendingGiant → placeGiant by the targeted player) and the legacy
      // form passing the crown directly.
      return engine.sendGiant({
        game,
        lordId,
        giantIndex: 0,
        targetPlayerId: target.p.id,
        ...(counter % 3 === 0 && { targetCrownPosition: target.free[0] }),
      });
    }
    default:
      return undefined;
  }
};

const OPTIONAL_ACTIONS: string[] = [
  playerActions.placeKnight,
  playerActions.constructBuilding,
  playerActions.useDragon,
  playerActions.placeFireToken,
  playerActions.recruitCaveman,
  playerActions.sendGiant,
];

type PlayedGame = {
  finalState: GameState;
  log: GameActionLog;
  gameEndCalls: number;
  /** Engine method that caused the transition to the result step */
  endingMethod: string | undefined;
  stats: Stats;
};

const playGame = (scenario: Scenario): PlayedGame => {
  let gameEndCalls = 0;
  let lastMethod: string | undefined;
  let endingMethod: string | undefined;

  const base = createGameEngine({
    events: {
      onGameEnd: () => {
        gameEndCalls++;
        endingMethod = lastMethod;
      },
    },
  });
  const { engine: logged, getLog } = wrapWithActionLog(base);

  // Track which engine method is being called
  const engine = Object.fromEntries(
    Object.entries(logged).map(([name, fn]) => [
      name,
      (cmd: unknown) => {
        lastMethod = name;
        return (fn as (c: unknown) => unknown)(cmd);
      },
    ]),
  ) as GameEngine;

  const stats: Stats = { pendingGiantPlacements: 0 };

  let game: GameState = engine.createGame({
    mode: scenario.mode,
    ...(scenario.seed !== undefined && { seed: scenario.seed }),
  });
  game = engine.addPlayers({ game, players: scenario.players });
  if (scenario.extraRules) {
    game = engine.addExtraRules({ game, extraRules: scenario.extraRules });
  }
  game = engine.startGame({ game });

  let counter = 0;
  let iterations = 0;
  while (isGameWithNextAction(game)) {
    if (++iterations > 3000) throw new Error("Simulation did not terminate");
    counter++;
    const action = game.nextAction.nextAction;

    if (action === playerActions.placeGiant && game.ageOfGiants?.pendingGiant) {
      stats.pendingGiantPlacements++;
    }

    let next: GameState | undefined;
    if (OPTIONAL_ACTIONS.includes(action)) {
      next = scenario.playOptional
        ? tryOptionalAction(engine, game, counter)
        : undefined;
      next ??= engine.skipOptionalAction({
        game,
        lordId: game.nextAction.nextLord,
      });
    } else {
      next = playBotTurn(engine, game, greedyStrategy);
    }
    game = next;
  }

  const log = getLog();
  for (const entry of log.entries) {
    stats[entry.action] = (stats[entry.action] ?? 0) + 1;
  }

  return { finalState: game, log, gameEndCalls, endingMethod, stats };
};

const SCENARIOS: Scenario[] = [
  {
    mode: "Classic",
    seed: "replay-classic",
    players: ["Alice", "Bob", "Carol"],
    extraRules: ["Harmony"],
    playOptional: true,
  },
  {
    mode: "Classic",
    players: [
      { id: "user-alice", name: "Alice" },
      { id: "user-bob", name: "Bob" },
    ],
    playOptional: true,
  },
  {
    mode: "QueenDomino",
    seed: "replay-qd",
    players: ["Alice", "Bob"],
    playOptional: true,
  },
  {
    mode: "QueenDomino",
    seed: "replay-qd-skip",
    players: ["Alice", "Bob", "Carol"],
    playOptional: false,
  },
  {
    mode: "KingdominoOrigins-Discovery",
    seed: "replay-discovery",
    players: ["Alice", "Bob"],
    playOptional: true,
  },
  {
    mode: "KingdominoOrigins-Totem",
    seed: "replay-totem",
    players: ["Alice", "Bob", "Carol"],
    playOptional: true,
  },
  {
    mode: "KingdominoOrigins-Tribe",
    seed: "replay-tribe",
    players: ["Alice", "Bob"],
    playOptional: true,
  },
  {
    mode: "KingdominoOrigins-Tribe",
    players: ["Alice", "Bob", "Carol"],
    playOptional: false,
  },
  {
    mode: "AgeOfGiants",
    seed: "replay-aog",
    players: ["Alice", "Bob", "Carol"],
    playOptional: true,
  },
  {
    mode: "AgeOfGiants-QueenDomino",
    seed: "replay-aog-qd",
    players: ["Alice", "Bob"],
    playOptional: true,
  },
  {
    mode: "AgeOfGiants-QueenDomino",
    players: ["Alice", "Bob", "Carol"],
    playOptional: false,
  },
];

const label = (s: Scenario) =>
  `${s.mode} (${s.players.length} players, ${s.seed ? `seed ${s.seed}` : "no seed"}, ${s.playOptional ? "optional actions played" : "optional actions skipped"})`;

describe("Action log replay — every mode", () => {
  const played = new Map<Scenario, PlayedGame>();
  const getPlayed = (scenario: Scenario): PlayedGame => {
    let result = played.get(scenario);
    if (!result) {
      result = playGame(scenario);
      played.set(scenario, result);
    }
    return result;
  };

  describe.each(
    SCENARIOS.map((s) => [label(s), s] as const),
  )("%s", (_name, scenario) => {
    test("reaches the result step and emits onGameEnd exactly once", () => {
      const { finalState, gameEndCalls } = getPlayed(scenario);
      expect(isGameWithNextStep(finalState)).toBe(true);
      expect(gameEndCalls).toBe(1);
    });

    test("replaying the log yields a strictly identical final state (ids included)", () => {
      const { finalState, log } = getPlayed(scenario);
      // A fresh engine with its own random uuids and default shuffle
      const replayEngine = createGameEngine({});
      const replayed = replayActions(replayEngine, log);
      expect(replayed).toStrictEqual(finalState);
    });

    test("the replayed log is itself replayable and JSON round-trips", () => {
      const { finalState, log } = getPlayed(scenario);
      const parsed = JSON.parse(JSON.stringify(log)) as GameActionLog;
      const replayed = replayActions(createGameEngine({}), parsed);
      expect(JSON.parse(JSON.stringify(replayed))).toEqual(
        JSON.parse(JSON.stringify(finalState)),
      );
    });

    test("records the effective seed even when none was given", () => {
      const { finalState, log } = getPlayed(scenario);
      const create = getActionsByType(log, "createGame")[0];
      expect(create?.payload).toMatchObject({
        mode: scenario.mode,
        seed: finalState.seed,
        gameId: finalState.id,
      });
      expect(finalState.seed).toBeTruthy();
      if (scenario.seed) expect(finalState.seed).toBe(scenario.seed);
    });
  });

  test("stable player ids passed to addPlayers are kept and replayed", () => {
    const scenario = SCENARIOS[1]!;
    const { finalState } = getPlayed(scenario);
    expect(finalState.players.map((p) => p.id)).toEqual([
      "user-alice",
      "user-bob",
    ]);
  });

  test("optional extension actions are all exercised and replayed", () => {
    const totals: Stats = { pendingGiantPlacements: 0 };
    for (const scenario of SCENARIOS) {
      const { stats } = getPlayed(scenario);
      for (const [key, value] of Object.entries(stats)) {
        const k = key as keyof Stats;
        totals[k] = ((totals[k] as number | undefined) ?? 0) + (value ?? 0);
      }
    }

    expect(totals.placeKnight).toBeGreaterThan(0);
    expect(totals.constructBuilding).toBeGreaterThan(0);
    expect(totals.useDragon).toBeGreaterThan(0);
    expect(totals.placeFireToken).toBeGreaterThan(0);
    expect(totals.recruitCaveman).toBeGreaterThan(0);
    expect(totals.sendGiant).toBeGreaterThan(0);
    expect(totals.placeGiant).toBeGreaterThan(0);
    expect(totals.skipOptionalAction).toBeGreaterThan(0);
    // A giant sent to an opponent with several free crowns: the targeted
    // player places it (placeGiant by a lord that is not the current one)
    expect(totals.pendingGiantPlacements).toBeGreaterThan(0);

    // Both sendGiant forms are recorded: with and without targetCrownPosition
    const sends = SCENARIOS.flatMap((s) =>
      getActionsByType(getPlayed(s).log, "sendGiant"),
    );
    expect(
      sends.some((e) => "targetCrownPosition" in (e.payload as object)),
    ).toBe(true);
    expect(
      sends.some((e) => !("targetCrownPosition" in (e.payload as object))),
    ).toBe(true);
  });

  test("onGameEnd is emitted when the game ends on an optional action", () => {
    // In QueenDomino, every placement is followed by optional actions, so the
    // game can never end on placeDomino/discardDomino.
    const qdSkip = getPlayed(SCENARIOS[3]!);
    expect(qdSkip.gameEndCalls).toBe(1);
    expect(qdSkip.endingMethod).toBe("skipOptionalAction");

    const endingMethods = new Set(
      SCENARIOS.map((s) => getPlayed(s).endingMethod),
    );
    expect(
      [...endingMethods].some(
        (m) => m !== "placeDomino" && m !== "discardDomino",
      ),
    ).toBe(true);
  });
});

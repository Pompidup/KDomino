import { NEOLITHIC_PAIRS } from "@core/domain/entities/neolithic.js";
import { validateGameState } from "@core/domain/entities/validateGameState.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  advancedStrategy,
  type BotStrategy,
  expertStrategy,
  greedyStrategy,
  playBotTurn,
  randomStrategy,
} from "@core/useCases/bot.js";
import {
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
import type { GameEventCallbacks } from "@core/useCases/gameEvents.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

/**
 * Kingdomino Origins — "Neolithic" special two player rules: the first lord
 * to pick in a line takes the pair 1 & 4 or 2 & 3 (positions in the sorted
 * line) for its player, the other player gets the two remaining dominoes.
 */

const ORIGINS_MODES = [
  "KingdominoOrigins-Discovery",
  "KingdominoOrigins-Totem",
  "KingdominoOrigins-Tribe",
] as const;

const setup = (
  engine: GameEngine,
  mode: string,
  seed: string,
  extraRules: string[] = ["Neolithic"],
): GameWithNextAction => {
  let game = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
  return engine.startGame({ game: engine.addExtraRules({ game, extraRules }) });
};

const positionOf = (game: GameState, dominoNumber: number): number =>
  game.currentDominoes.find((d) => d.domino.number === dominoNumber)!.position;

const numberAt = (game: GameState, position: number): number =>
  game.currentDominoes.find((d) => d.position === position)!.domino.number;

const playerOf = (game: GameState, lordId: string): string =>
  game.lords.find((l) => l.id === lordId)!.playerId;

/** Skips Tribe's recruitCaveman (the optional action after a pick). */
const skipToPick = (
  engine: GameEngine,
  start: GameState,
): GameWithNextAction => {
  let game = start;
  while (
    isGameWithNextAction(game) &&
    game.nextAction.nextAction === "recruitCaveman"
  ) {
    game = engine.skipOptionalAction({
      game,
      lordId: game.nextAction.nextLord,
    });
  }
  return game as GameWithNextAction;
};

/** Plays the current pick and checks the action is accepted. */
const pick = (
  engine: GameEngine,
  game: GameWithNextAction,
  dominoPick: number,
): GameWithNextAction =>
  skipToPick(
    engine,
    engine.chooseDomino({ game, lordId: game.nextAction.nextLord, dominoPick }),
  );

const expectErrorCode = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (error) {
    expect((error as { code?: string }).code).toBe(code);
    return;
  }
  throw new Error(`Expected error ${code}`);
};

describe("Neolithic: pair choice of the first pick", () => {
  test.each(
    ORIGINS_MODES,
  )("%s: picking position 1 reserves 1 & 4 for the player, 2 & 3 for the opponent", (mode) => {
    const engine = createGameEngine({});
    const game = setup(engine, mode, `neolithic-14-${mode}`);
    const lordId = game.nextAction.nextLord;
    const playerId = playerOf(game, lordId);
    const opponentId = game.players.find((p) => p.id !== playerId)!.id;

    expect(game.currentDominoes).toHaveLength(4);
    expect(game.currentDominoes.every((d) => d.reservedFor === undefined)).toBe(
      true,
    );
    // The pair choice: any domino of the line
    expect(engine.getValidDominoPicks({ game })).toHaveLength(4);

    const next = engine.chooseDomino({
      game,
      lordId,
      dominoPick: numberAt(game, 1),
    });

    const reservations = Object.fromEntries(
      next.currentDominoes.map((d) => [d.position, d.reservedFor]),
    );
    expect(reservations).toEqual({
      1: playerId,
      4: playerId,
      2: opponentId,
      3: opponentId,
    });
    expect(validateGameState(next)).toEqual([]);
  });

  test("validateGameState rejects a reservation for an unknown player", () => {
    const engine = createGameEngine({});
    const game = setup(
      engine,
      "KingdominoOrigins-Discovery",
      "neolithic-valid",
    );
    const corrupted = {
      ...game,
      currentDominoes: game.currentDominoes.map((d) => ({
        ...d,
        reservedFor: "ghost",
      })),
    };
    expect(validateGameState(corrupted).map((i) => i.code)).toContain(
      "RESERVED_PLAYER_NOT_FOUND",
    );
  });

  test("picking position 3 reserves 2 & 3 for the player", () => {
    const engine = createGameEngine({});
    const game = setup(engine, "KingdominoOrigins-Discovery", "neolithic-23");
    const lordId = game.nextAction.nextLord;
    const playerId = playerOf(game, lordId);

    const next = engine.chooseDomino({
      game,
      lordId,
      dominoPick: numberAt(game, 3),
    });

    const own = next.currentDominoes
      .filter((d) => d.reservedFor === playerId)
      .map((d) => d.position)
      .sort();
    expect(own).toEqual([2, 3]);
  });

  test("each lord can only pick a domino reserved for its player", () => {
    const engine = createGameEngine({});
    let game = setup(engine, "KingdominoOrigins-Discovery", "neolithic-picks");
    const first = playerOf(game, game.nextAction.nextLord);
    const line = game.currentDominoes;
    const ownedByFirst = [numberAt(game, 2)];
    const startTurn = game.turn;
    game = pick(engine, game, numberAt(game, 2));

    while (game.turn === startTurn) {
      const lordId = game.nextAction.nextLord;
      const playerId = playerOf(game, lordId);
      const valid = engine.getValidDominoPicks({ game });
      const expected = game.currentDominoes
        .filter((d) => !d.picked && d.reservedFor === playerId)
        .map((d) => d.domino.number);
      expect(valid).toEqual(expected);
      expect(valid.length).toBeGreaterThan(0);

      const forbidden = game.currentDominoes.find(
        (d) => !d.picked && d.reservedFor !== playerId,
      );
      if (forbidden) {
        expectErrorCode(
          () =>
            engine.chooseDomino({
              game,
              lordId,
              dominoPick: forbidden.domino.number,
            }),
          ErrorCode.DOMINO_RESERVED,
        );
      }
      if (playerId === first) ownedByFirst.push(valid[0]!);
      game = pick(engine, game, valid[0]!);
    }

    // The first player got the dominoes 2 and 3 of the first line
    const positions = ownedByFirst
      .map((n) => line.find((d) => d.domino.number === n)!.position)
      .sort();
    expect(positions).toEqual([2, 3]);
  });

  test("the pair rule applies again to every new line", () => {
    const engine = createGameEngine({});
    let game = setup(engine, "KingdominoOrigins-Discovery", "neolithic-turns");
    let guard = 0;
    const isFirstPickOfTurn3 = (state: GameWithNextAction) =>
      state.turn === 3 &&
      state.nextAction.nextAction === "pickDomino" &&
      state.currentDominoes.every((d) => !d.picked);
    while (!isFirstPickOfTurn3(game)) {
      if (guard++ > 500) throw new Error("Turn 3 not reached");
      const next = playBotTurn(engine, game, greedyStrategy);
      if (!isGameWithNextAction(next)) throw new Error("Game ended too early");
      game = next;
    }
    // New line, nothing reserved before its first pick
    expect(game.currentDominoes.some((d) => d.picked)).toBe(false);
    expect(game.currentDominoes.every((d) => d.reservedFor === undefined)).toBe(
      true,
    );
    const next = engine.chooseDomino({
      game,
      lordId: game.nextAction.nextLord,
      dominoPick: numberAt(game, 4),
    });
    expect(next.currentDominoes.every((d) => d.reservedFor !== undefined)).toBe(
      true,
    );
  });

  test("without Neolithic nothing is reserved", () => {
    const engine = createGameEngine({});
    let game = setup(engine, "KingdominoOrigins-Discovery", "no-neolithic", []);
    game = pick(engine, game, numberAt(game, 1));
    expect(game.currentDominoes.every((d) => d.reservedFor === undefined)).toBe(
      true,
    );
    expect(engine.getValidDominoPicks({ game })).toHaveLength(3);
  });

  test("The Mighty Duel (Classic) keeps the free choice", () => {
    const engine = createGameEngine({});
    let game = engine.createGame({ mode: "Classic", seed: "duel" });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
    game = engine.addExtraRules({ game, extraRules: ["The Mighty Duel"] });
    let started = engine.startGame({ game });
    started = engine.chooseDomino({
      game: started,
      lordId: started.nextAction.nextLord,
      dominoPick: numberAt(started, 1),
    });
    expect(
      started.currentDominoes.every((d) => d.reservedFor === undefined),
    ).toBe(true);
  });
});

describe("getValidDominoPicks", () => {
  test("is empty when the game does not wait for this lord to pick", () => {
    const engine = createGameEngine({});
    const game = setup(engine, "KingdominoOrigins-Discovery", "valid-picks");
    const other = game.lords.find((l) => l.id !== game.nextAction.nextLord)!;
    expect(engine.getValidDominoPicks({ game, lordId: other.id })).toEqual([]);

    let created = engine.createGame({ mode: "Classic" });
    expect(engine.getValidDominoPicks({ game: created })).toEqual([]);
    created = engine.addPlayers({ game: created, players: ["Alice", "Bobby"] });
    expect(engine.getValidDominoPicks({ game: created })).toEqual([]);
  });

  test("lists every unpicked domino in a game without reservation", () => {
    const engine = createGameEngine({});
    let game = engine.createGame({ mode: "Classic", seed: "classic-picks" });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby", "Carol"] });
    const started = engine.startGame({ game });
    expect(engine.getValidDominoPicks({ game: started })).toEqual(
      started.currentDominoes.map((d) => d.domino.number),
    );
  });
});

describe("Neolithic events", () => {
  test("onNeolithicPairChosen is emitted once per line, after onDominoPicked", () => {
    const calls: string[] = [];
    const pairs: { playerId: string; own: number[]; other: number[] }[] = [];
    const events: GameEventCallbacks = {
      onDominoPicked: () => calls.push("picked"),
      onNeolithicPairChosen: ({
        playerId,
        dominoNumbers,
        opponentDominoNumbers,
      }) => {
        calls.push("pair");
        pairs.push({
          playerId,
          own: dominoNumbers,
          other: opponentDominoNumbers,
        });
      },
    };
    const engine = createGameEngine({ events });
    let game = setup(engine, "KingdominoOrigins-Discovery", "neolithic-events");
    const playerId = playerOf(game, game.nextAction.nextLord);
    const one = numberAt(game, 1);
    const four = numberAt(game, 4);
    game = pick(engine, game, one);

    expect(calls).toEqual(["picked", "pair"]);
    expect(pairs).toEqual([
      {
        playerId,
        own: [one, four],
        other: [numberAt(game, 2), numberAt(game, 3)],
      },
    ]);

    game = pick(engine, game, engine.getValidDominoPicks({ game })[0]!);
    expect(calls).toEqual(["picked", "pair", "picked"]);
  });
});

// ─── Complete games ──────────────────────────────────────────────────

/**
 * Plays a whole Neolithic game with bots and checks, line by line, that each
 * player picked exactly one of the official pairs.
 */
const playNeolithicGame = (
  engine: GameEngine,
  mode: string,
  seed: string,
  strategies: [BotStrategy, BotStrategy],
): GameState => {
  let game: GameState = setup(engine, mode, seed);
  const seats = new Map(
    game.players.map((p, index) => [p.id, strategies[index]!] as const),
  );
  // line key -> player id -> picked positions
  const picks = new Map<string, Map<string, number[]>>();
  let steps = 0;

  while (isGameWithNextAction(game)) {
    if (++steps > 5000) throw new Error("Game did not finish");
    const lordId = game.nextAction.nextLord;
    const playerId = playerOf(game, lordId);
    const before = game;
    game = playBotTurn(engine, game, seats.get(playerId)!);

    if (before.nextAction.nextAction === "pickDomino") {
      const picked = game.lords.find((l) => l.id === lordId)!.dominoPicked!;
      const line = before.currentDominoes.map((d) => d.domino.number).join(",");
      const byPlayer = picks.get(line) ?? new Map<string, number[]>();
      byPlayer.set(playerId, [
        ...(byPlayer.get(playerId) ?? []),
        positionOf(before, picked.number),
      ]);
      picks.set(line, byPlayer);
    }
  }

  const official = NEOLITHIC_PAIRS.map((pair) => [...pair].join(","));
  expect(picks.size).toBeGreaterThan(0);
  for (const byPlayer of picks.values()) {
    expect(byPlayer.size).toBe(2);
    for (const positions of byPlayer.values()) {
      expect(official).toContain(
        [...positions].sort((a, b) => a - b).join(","),
      );
    }
  }
  return game;
};

describe("Neolithic: complete bot games", () => {
  test.each(
    ORIGINS_MODES,
  )("%s: a bot-only game reaches the result step", (mode) => {
    const engine = createGameEngine({});
    const game = playNeolithicGame(engine, mode, `bots-${mode}`, [
      greedyStrategy,
      randomStrategy,
    ]);
    expect(isGameWithNextStep(game) && game.nextAction.step).toBe("result");
    expect(engine.getResults({ game }).result).toHaveLength(2);
  });

  test("advanced against expert in Tribe mode", () => {
    const engine = createGameEngine({});
    const game = playNeolithicGame(
      engine,
      "KingdominoOrigins-Tribe",
      "bots-strong",
      [advancedStrategy, expertStrategy],
    );
    expect(isGameWithNextStep(game) && game.nextAction.step).toBe("result");
  }, 30_000);
});

describe("Neolithic: action log replay", () => {
  test.each(
    ORIGINS_MODES,
  )("%s: replaying the log gives the identical game state", (mode) => {
    const { engine, getLog } = wrapWithActionLog(createGameEngine({}));
    const game = playNeolithicGame(engine, mode, `replay-${mode}`, [
      advancedStrategy,
      randomStrategy,
    ]);
    const log = getLog();
    expect(getActionsByType(log, "chooseDomino").length).toBeGreaterThan(0);

    const replayed = replayActions(
      createGameEngine({}),
      JSON.parse(JSON.stringify(log)),
    );
    expect(JSON.parse(JSON.stringify(replayed))).toEqual(
      JSON.parse(JSON.stringify(game)),
    );
  }, 30_000);
});

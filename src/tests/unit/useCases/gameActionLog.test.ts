import type { NextAction, NextStep } from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  ACTION_LOG_VERSION,
  appendAction,
  createActionLog,
  getActions,
  getActionsByTurn,
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

// ─── Helpers ────────────────────────────────────────────────────────

const stepAddPlayers: NextStep = { type: "step", step: "addPlayers" };
const stepOptions: NextStep = { type: "step", step: "options" };
const stepStart: NextStep = { type: "step", step: "start" };
const actionPick: NextAction = {
  type: "action",
  nextLord: "lord1-id",
  nextAction: "pickDomino",
};

const buildGameWithStep = (step: NextStep, turn = 0) =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction(step)
    .withTurn(turn)
    .build();

const buildGameWithAction = (action: NextAction, turn = 0) =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction(action)
    .withTurn(turn)
    .build();

// ─── createActionLog ────────────────────────────────────────────────

describe("GameActionLog", () => {
  describe("createActionLog", () => {
    test("should create an empty log with the given game ID", () => {
      const log = createActionLog("game-123");

      expect(log.gameId).toBe("game-123");
      expect(log.entries).toEqual([]);
    });
  });

  // ─── appendAction ──────────────────────────────────────────────────

  describe("appendAction", () => {
    test("should append an entry with auto-incremented id", () => {
      let log = createActionLog("game-1");

      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });

      expect(log.entries).toHaveLength(1);
      expect(log.entries[0]?.id).toBe(0);
      expect(log.entries[0]?.action).toBe("createGame");
      expect(log.entries[0]?.payload).toEqual({ mode: "Classic" });
      expect(log.entries[0]?.turn).toBe(0);
      expect(log.entries[0]?.timestamp).toBeTypeOf("number");
    });

    test("should auto-increment ids across multiple appends", () => {
      let log = createActionLog("game-1");

      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });
      log = appendAction(log, {
        action: "startGame",
        payload: {},
        turn: 0,
      });

      expect(log.entries[0]?.id).toBe(0);
      expect(log.entries[1]?.id).toBe(1);
      expect(log.entries[2]?.id).toBe(2);
    });

    test("should return a new log (immutable)", () => {
      const log1 = createActionLog("game-1");
      const log2 = appendAction(log1, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });

      expect(log1.entries).toHaveLength(0);
      expect(log2.entries).toHaveLength(1);
      expect(log1).not.toBe(log2);
    });
  });

  // ─── getActions ────────────────────────────────────────────────────

  describe("getActions", () => {
    test("should return all entries", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice"] },
        turn: 0,
      });

      const actions = getActions(log);
      expect(actions).toHaveLength(2);
    });

    test("should return empty array for empty log", () => {
      const log = createActionLog("game-1");
      expect(getActions(log)).toEqual([]);
    });
  });

  // ─── getActionsByType ──────────────────────────────────────────────

  describe("getActionsByType", () => {
    test("should filter entries by action type", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l1", dominoPick: 5 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "placeDomino",
        payload: { lordId: "l1", position: { x: 4, y: 5 }, rotation: 0 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l2", dominoPick: 8 },
        turn: 1,
      });

      const picks = getActionsByType(log, "chooseDomino");
      expect(picks).toHaveLength(2);
      expect(picks.every((e) => e.action === "chooseDomino")).toBe(true);
    });

    test("should return empty for non-matching type", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });

      expect(getActionsByType(log, "discardDomino")).toEqual([]);
    });
  });

  // ─── getActionsByTurn ──────────────────────────────────────────────

  describe("getActionsByTurn", () => {
    test("should filter entries by turn number", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l1", dominoPick: 1 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l2", dominoPick: 2 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l1", dominoPick: 3 },
        turn: 2,
      });

      const turn1Actions = getActionsByTurn(log, 1);
      expect(turn1Actions).toHaveLength(2);
      expect(turn1Actions.every((e) => e.turn === 1)).toBe(true);
    });
  });

  // ─── wrapWithActionLog ─────────────────────────────────────────────

  describe("wrapWithActionLog", () => {
    let mockEngine: GameEngine;

    beforeEach(() => {
      const gameStep = buildGameWithStep(stepAddPlayers);
      const gameOptions = buildGameWithStep(stepOptions);
      const gameStart = buildGameWithStep(stepStart);
      const gameAction = buildGameWithAction(actionPick, 1);

      mockEngine = {
        getModes: vi.fn().mockReturnValue([]),
        getExtraRules: vi.fn().mockReturnValue([]),
        calculateScore: vi.fn().mockReturnValue({ points: 0 }),
        getValidPlacements: vi.fn().mockReturnValue([]),
        canPlaceDomino: vi.fn().mockReturnValue(false),
        serialize: vi.fn().mockReturnValue("{}"),
        deserialize: vi.fn().mockReturnValue(gameStep),
        getResults: vi.fn().mockReturnValue(gameStep),
        getDynastyResults: vi.fn().mockReturnValue([]),
        createGame: vi.fn().mockReturnValue(gameStep),
        addPlayers: vi.fn().mockReturnValue(gameOptions),
        addExtraRules: vi.fn().mockReturnValue(gameStart),
        startGame: vi.fn().mockReturnValue(gameAction),
        chooseDomino: vi.fn().mockReturnValue(gameAction),
        placeDomino: vi.fn().mockReturnValue(gameAction),
        discardDomino: vi.fn().mockReturnValue(gameAction),
      };
    });

    test("should record createGame action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      const game = engine.createGame({ mode: "Classic", seed: "test-seed" });

      const log = getLog();
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0]?.action).toBe("createGame");
      expect(log.entries[0]?.payload).toEqual({
        mode: "Classic",
        seed: game.seed ?? "test-seed",
        gameId: game.id,
      });
    });

    test("should reset log on createGame (new game = new log)", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.addPlayers({
        game: buildGameWithStep(stepAddPlayers),
        players: ["Alice"],
      });
      engine.createGame({ mode: "Classic" });

      const log = getLog();
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0]?.action).toBe("createGame");
    });

    test("should record addPlayers action without game state", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      const game = engine.addPlayers({
        game: buildGameWithStep(stepAddPlayers),
        players: ["Alice", "Bob"],
      });

      const log = getLog();
      expect(log.entries).toHaveLength(2);
      expect(log.entries[1]?.action).toBe("addPlayers");
      // Players are recorded with the ids the engine assigned
      expect(log.entries[1]?.payload).toEqual({
        players: game.players.map((p) => ({ id: p.id, name: p.name })),
      });
    });

    test("should record addExtraRules action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.addExtraRules({
        game: buildGameWithStep(stepOptions),
        extraRules: ["TheMiddleKingdom"],
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("addExtraRules");
      expect(log.entries[1]?.payload).toEqual({
        extraRules: ["TheMiddleKingdom"],
      });
    });

    test("should record startGame action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      const game = engine.startGame({ game: buildGameWithStep(stepStart) });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("startGame");
      // Lord ids are recorded so a replay reproduces them
      expect(log.entries[1]?.payload).toEqual({
        lordIds: game.lords.map((l) => l.id),
      });
    });

    test("should record chooseDomino action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.chooseDomino({
        game: buildGameWithAction(actionPick),
        lordId: "lord-1",
        dominoPick: 42,
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("chooseDomino");
      expect(log.entries[1]?.payload).toEqual({
        lordId: "lord-1",
        dominoPick: 42,
      });
    });

    test("should record placeDomino action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.placeDomino({
        game: buildGameWithAction(actionPick),
        lordId: "lord-1",
        position: { x: 5, y: 4 },
        rotation: 90,
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("placeDomino");
      expect(log.entries[1]?.payload).toEqual({
        lordId: "lord-1",
        position: { x: 5, y: 4 },
        rotation: 90,
      });
    });

    test("should record discardDomino action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.discardDomino({
        game: buildGameWithAction(actionPick),
        lordId: "lord-1",
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("discardDomino");
      expect(log.entries[1]?.payload).toEqual({ lordId: "lord-1" });
    });

    test("should pass through read-only methods without recording", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.getModes({});
      engine.calculateScore({ kingdom: [] });

      expect(getLog().entries).toHaveLength(0);
    });

    test("should set log gameId from createGame result", () => {
      const gameWithId = buildGameWithStep(stepAddPlayers);
      (mockEngine.createGame as ReturnType<typeof vi.fn>).mockReturnValue(
        gameWithId,
      );

      const { engine, getLog } = wrapWithActionLog(mockEngine);
      engine.createGame({ mode: "Classic" });

      expect(getLog().gameId).toBe(gameWithId.id);
    });
  });

  // ─── replayActions ─────────────────────────────────────────────────

  describe("replayActions", () => {
    let mockEngine: GameEngine;
    const gameStep = buildGameWithStep(stepAddPlayers);
    const gameOptions = buildGameWithStep(stepOptions);
    const gameAction = buildGameWithAction(actionPick, 1);

    beforeEach(() => {
      mockEngine = {
        getModes: vi.fn(),
        getExtraRules: vi.fn(),
        calculateScore: vi.fn(),
        getValidPlacements: vi.fn(),
        canPlaceDomino: vi.fn(),
        serialize: vi.fn(),
        deserialize: vi.fn(),
        getResults: vi.fn(),
        getDynastyResults: vi.fn(),
        createGame: vi.fn().mockReturnValue(gameStep),
        addPlayers: vi.fn().mockReturnValue(gameOptions),
        addExtraRules: vi.fn().mockReturnValue(gameOptions),
        startGame: vi.fn().mockReturnValue(gameAction),
        chooseDomino: vi.fn().mockReturnValue(gameAction),
        placeDomino: vi.fn().mockReturnValue(gameAction),
        discardDomino: vi.fn().mockReturnValue(gameAction),
      };
    });

    test("should replay createGame action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic", seed: "seed-42" },
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.createGame).toHaveBeenCalledWith({
        mode: "Classic",
        seed: "seed-42",
      });
    });

    test("should replay addPlayers action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.addPlayers).toHaveBeenCalledWith({
        game: gameStep,
        players: ["Alice", "Bob"],
      });
    });

    test("should replay a sequence of actions in order", () => {
      const callOrder: string[] = [];
      (mockEngine.createGame as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          callOrder.push("createGame");
          return gameStep;
        },
      );
      (mockEngine.addPlayers as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          callOrder.push("addPlayers");
          return gameOptions;
        },
      );
      (mockEngine.startGame as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          callOrder.push("startGame");
          return gameAction;
        },
      );

      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });
      log = appendAction(log, {
        action: "startGame",
        payload: {},
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(callOrder).toEqual(["createGame", "addPlayers", "startGame"]);
    });

    test("should throw on empty log", () => {
      const log = createActionLog("game-1");
      expect(() => replayActions(mockEngine, log)).toThrow(
        "Cannot replay an empty action log",
      );
    });

    test("should replay chooseDomino action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });
      (mockEngine.addPlayers as ReturnType<typeof vi.fn>).mockReturnValue(
        buildGameWithStep(stepStart),
      );
      (mockEngine.startGame as ReturnType<typeof vi.fn>).mockReturnValue(
        gameAction,
      );
      log = appendAction(log, { action: "startGame", payload: {}, turn: 0 });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "lord-1", dominoPick: 5 },
        turn: 1,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.chooseDomino).toHaveBeenCalledWith({
        game: gameAction,
        lordId: "lord-1",
        dominoPick: 5,
      });
    });

    test("should replay placeDomino action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "placeDomino",
        payload: { lordId: "lord-1", position: { x: 5, y: 4 }, rotation: 90 },
        turn: 1,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.placeDomino).toHaveBeenCalledWith({
        game: gameStep,
        lordId: "lord-1",
        position: { x: 5, y: 4 },
        rotation: 90,
      });
    });

    test("should replay discardDomino action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "discardDomino",
        payload: { lordId: "lord-1" },
        turn: 1,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.discardDomino).toHaveBeenCalledWith({
        game: gameStep,
        lordId: "lord-1",
      });
    });

    test("should replay addExtraRules action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addExtraRules",
        payload: { extraRules: ["Harmony"] },
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.addExtraRules).toHaveBeenCalledWith({
        game: gameStep,
        extraRules: ["Harmony"],
      });
    });
  });

  // ─── Extension actions, ids and versions ───────────────────────────

  describe("extension actions", () => {
    const actionGame = buildGameWithAction(actionPick, 1);
    const makeEngine = (): GameEngine =>
      ({
        createGame: vi.fn().mockReturnValue(buildGameWithStep(stepAddPlayers)),
        placeKnight: vi.fn().mockReturnValue(actionGame),
        constructBuilding: vi.fn().mockReturnValue(actionGame),
        useDragon: vi.fn().mockReturnValue(actionGame),
        placeFireToken: vi.fn().mockReturnValue(actionGame),
        recruitCaveman: vi.fn().mockReturnValue(actionGame),
        skipOptionalAction: vi.fn().mockReturnValue(actionGame),
        placeGiant: vi.fn().mockReturnValue(actionGame),
        sendGiant: vi.fn().mockReturnValue(actionGame),
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      }) as any;

    const position = { x: 3, y: 4 };
    const cases = [
      ["placeKnight", { lordId: "l1", position }],
      ["constructBuilding", { lordId: "l1", buildingId: 7, position }],
      ["useDragon", { lordId: "l1", buildingId: 7 }],
      ["placeFireToken", { lordId: "l1", position }],
      [
        "recruitCaveman",
        {
          lordId: "l1",
          cavemanId: 2,
          position,
          resourcePositions: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
        },
      ],
      ["skipOptionalAction", { lordId: "l1" }],
      ["placeGiant", { lordId: "l1", position }],
      ["sendGiant", { lordId: "l1", giantIndex: 0, targetPlayerId: "p2" }],
      [
        "sendGiant",
        {
          lordId: "l1",
          giantIndex: 0,
          targetPlayerId: "p2",
          targetCrownPosition: position,
        },
      ],
    ] as const;

    test.each(cases)("should record and replay %s", (action, payload) => {
      const engine = makeEngine();
      const { engine: logged, getLog } = wrapWithActionLog(engine);
      logged.createGame({ mode: "QueenDomino" });
      // biome-ignore lint/suspicious/noExplicitAny: dynamic dispatch in test
      (logged[action] as any)({ game: actionGame, ...payload });

      const log = getLog();
      expect(log.entries[1]?.action).toBe(action);
      expect(log.entries[1]?.payload).toStrictEqual(payload);

      const replayEngine = makeEngine();
      const created = buildGameWithStep(stepAddPlayers);
      (replayEngine.createGame as ReturnType<typeof vi.fn>).mockReturnValue(
        created,
      );
      replayActions(replayEngine, log);
      expect(replayEngine[action]).toHaveBeenCalledWith({
        game: { ...created, id: log.gameId },
        ...payload,
      });
    });
  });

  describe("ids and versions", () => {
    test("should create logs with the current version", () => {
      expect(createActionLog("g").version).toBe(ACTION_LOG_VERSION);
    });

    test("should refuse logs from a newer version", () => {
      const log = {
        ...appendAction(createActionLog("g"), {
          action: "createGame",
          payload: { mode: "Classic" },
          turn: 0,
        }),
        version: ACTION_LOG_VERSION + 1,
      };
      const engine = {
        createGame: vi.fn(),
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any;

      expect(() => replayActions(engine, log)).toThrow(
        "Unsupported action log version",
      );
    });

    test("should replay legacy (version 1) logs without ids", () => {
      const gameStep = buildGameWithStep(stepAddPlayers);
      const engine = {
        createGame: vi.fn().mockReturnValue(gameStep),
        addPlayers: vi.fn().mockReturnValue(buildGameWithStep(stepOptions)),
        startGame: vi.fn().mockReturnValue(buildGameWithAction(actionPick)),
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any;
      const legacy = {
        gameId: "old-game",
        entries: [
          {
            id: 0,
            timestamp: 0,
            action: "createGame",
            payload: { mode: "Classic" },
            turn: 0,
          },
          {
            id: 1,
            timestamp: 0,
            action: "addPlayers",
            payload: { players: ["Alice", "Bob"] },
            turn: 0,
          },
          { id: 2, timestamp: 0, action: "startGame", payload: {}, turn: 0 },
        ],
      } as const;

      const game = replayActions(
        engine,
        legacy as unknown as Parameters<typeof replayActions>[1],
      );

      expect(engine.addPlayers).toHaveBeenCalledWith({
        game: gameStep,
        players: ["Alice", "Bob"],
      });
      expect(game.lords).toEqual(buildGameWithAction(actionPick).lords);
    });

    test("should restore the recorded game id and lord ids on replay", () => {
      const started = buildGameWithAction(
        { type: "action", nextLord: "new-lord-2", nextAction: "pickDomino" },
        0,
      );
      started.lords = [
        { ...started.lords[0]!, id: "new-lord-1" },
        { ...started.lords[1]!, id: "new-lord-2" },
      ];
      const engine = {
        createGame: vi
          .fn()
          .mockReturnValue({ ...buildGameWithStep(stepStart), id: "new-game" }),
        startGame: vi
          .fn()
          .mockImplementation(({ game }: { game: { id: string } }) => ({
            ...started,
            id: game.id,
          })),
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any;

      let log = createActionLog("original-game");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic", seed: "s", gameId: "original-game" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "startGame",
        payload: { lordIds: ["lord-a", "lord-b"] },
        turn: 0,
      });

      const game = replayActions(engine, log);

      expect(game.id).toBe("original-game");
      expect(game.lords.map((l) => l.id)).toEqual(["lord-a", "lord-b"]);
      expect(game.nextAction).toEqual({
        type: "action",
        nextLord: "lord-b",
        nextAction: "pickDomino",
      });
    });
  });
});

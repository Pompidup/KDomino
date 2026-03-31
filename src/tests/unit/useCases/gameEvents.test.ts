import { describe, test, expect, vi } from "vitest";
import {
  wrapWithEvents,
  type GameEventCallbacks,
} from "@core/useCases/gameEvents.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import type {
  GameWithNextStep,
  GameWithNextAction,
  GameState,
} from "@core/domain/types/game.js";

// ─── Mock Engine ─────────────────────────────────────────────────────

const stepGame = (step: string, turn = 0): GameWithNextStep =>
  ({ id: "g1", turn, nextAction: { type: "step", step } }) as any;

const actionGame = (action: string, turn = 1): GameWithNextAction =>
  ({
    id: "g1",
    turn,
    nextAction: { type: "action", nextLord: "lord1", nextAction: action },
  }) as any;

const resultGame = (): GameState =>
  ({ id: "g1", turn: 6, nextAction: { type: "step", step: "result" } }) as any;

const createMockEngine = (overrides: Partial<GameEngine> = {}): GameEngine =>
  ({
    getModes: vi.fn(),
    getExtraRules: vi.fn(),
    createGame: vi.fn().mockReturnValue(stepGame("addPlayers")),
    addPlayers: vi.fn().mockReturnValue(stepGame("options")),
    addExtraRules: vi.fn().mockReturnValue(stepGame("start")),
    startGame: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
    chooseDomino: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
    placeDomino: vi.fn().mockReturnValue(actionGame("placeDomino", 1)),
    discardDomino: vi.fn().mockReturnValue(actionGame("pass", 1)),
    getResults: vi.fn(),
    calculateScore: vi.fn(),
    getValidPlacements: vi.fn(),
    canPlaceDomino: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    getDynastyResults: vi.fn(),
    ...overrides,
  }) as any;

// ─── Tests ───────────────────────────────────────────────────────────

describe("GameEvents", () => {
  describe("wrapWithEvents", () => {
    test("should call onGameCreated after createGame", () => {
      const onGameCreated = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onGameCreated });

      wrapped.createGame({ mode: "Classic" });

      expect(onGameCreated).toHaveBeenCalledOnce();
      expect(onGameCreated).toHaveBeenCalledWith({
        game: stepGame("addPlayers"),
      });
    });

    test("should call onPlayersAdded after addPlayers", () => {
      const onPlayersAdded = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onPlayersAdded });

      wrapped.addPlayers({ game: stepGame("addPlayers"), players: ["A", "B"] });

      expect(onPlayersAdded).toHaveBeenCalledOnce();
    });

    test("should call onGameStarted and onTurnStart after startGame", () => {
      const onGameStarted = vi.fn();
      const onTurnStart = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onGameStarted, onTurnStart });

      wrapped.startGame({ game: stepGame("start") });

      expect(onGameStarted).toHaveBeenCalledOnce();
      expect(onTurnStart).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 1),
        turn: 1,
      });
    });

    test("should call onDominoPicked after chooseDomino", () => {
      const onDominoPicked = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onDominoPicked });

      const cmd = {
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        dominoPick: 5,
      };
      wrapped.chooseDomino(cmd);

      expect(onDominoPicked).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        dominoNumber: 5,
      });
    });

    test("should call onTurnEnd and onTurnStart when turn changes in chooseDomino", () => {
      const onTurnEnd = vi.fn();
      const onTurnStart = vi.fn();
      // Engine returns game with turn 2 (turn changed from 1 to 2)
      const engine = createMockEngine({
        chooseDomino: vi.fn().mockReturnValue(actionGame("pickDomino", 2)),
      });
      const wrapped = wrapWithEvents(engine, { onTurnEnd, onTurnStart });

      const cmd = {
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        dominoPick: 5,
      };
      wrapped.chooseDomino(cmd);

      expect(onTurnEnd).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 2),
        turn: 1,
      });
      expect(onTurnStart).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 2),
        turn: 2,
      });
    });

    test("should NOT call onTurnEnd when turn does not change", () => {
      const onTurnEnd = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onTurnEnd });

      const cmd = {
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        dominoPick: 5,
      };
      wrapped.chooseDomino(cmd);

      expect(onTurnEnd).not.toHaveBeenCalled();
    });

    test("should call onDominoPlaced after placeDomino", () => {
      const onDominoPlaced = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onDominoPlaced });

      const cmd = {
        game: actionGame("placeDomino", 1),
        lordId: "lord1",
        position: { x: 3, y: 4 },
        rotation: 0 as const,
      };
      wrapped.placeDomino(cmd);

      expect(onDominoPlaced).toHaveBeenCalledWith({
        game: expect.anything(),
        lordId: "lord1",
      });
    });

    test("should call onGameEnd when placeDomino transitions to result", () => {
      const onGameEnd = vi.fn();
      const engine = createMockEngine({
        placeDomino: vi.fn().mockReturnValue(resultGame()),
      });
      const wrapped = wrapWithEvents(engine, { onGameEnd });

      const cmd = {
        game: actionGame("placeDomino", 6),
        lordId: "lord1",
        position: { x: 3, y: 4 },
        rotation: 0 as const,
      };
      wrapped.placeDomino(cmd);

      expect(onGameEnd).toHaveBeenCalledOnce();
      expect(onGameEnd).toHaveBeenCalledWith({ game: resultGame() });
    });

    test("should call onDominoDiscarded after discardDomino", () => {
      const onDominoDiscarded = vi.fn();
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, { onDominoDiscarded });

      wrapped.discardDomino({
        game: actionGame("pass", 1),
        lordId: "lord1",
      });

      expect(onDominoDiscarded).toHaveBeenCalledWith({
        game: expect.anything(),
        lordId: "lord1",
      });
    });

    test("should call onGameEnd when discardDomino transitions to result", () => {
      const onGameEnd = vi.fn();
      const engine = createMockEngine({
        discardDomino: vi.fn().mockReturnValue(resultGame()),
      });
      const wrapped = wrapWithEvents(engine, { onGameEnd });

      wrapped.discardDomino({
        game: actionGame("pass", 6),
        lordId: "lord1",
      });

      expect(onGameEnd).toHaveBeenCalledOnce();
    });

    test("should not crash when no callbacks provided", () => {
      const engine = createMockEngine();
      const wrapped = wrapWithEvents(engine, {});

      expect(() => {
        wrapped.createGame({ mode: "Classic" });
        wrapped.addPlayers({
          game: stepGame("addPlayers"),
          players: ["A", "B"],
        });
        wrapped.startGame({ game: stepGame("start") });
        wrapped.chooseDomino({
          game: actionGame("pickDomino", 1),
          lordId: "lord1",
          dominoPick: 1,
        });
        wrapped.placeDomino({
          game: actionGame("placeDomino", 1),
          lordId: "lord1",
          position: { x: 3, y: 4 },
          rotation: 0,
        });
        wrapped.discardDomino({
          game: actionGame("pass", 1),
          lordId: "lord1",
        });
      }).not.toThrow();
    });

    test("should pass through read-only methods unchanged", () => {
      const engine = createMockEngine({
        getModes: vi.fn().mockReturnValue([{ name: "Classic" }]),
      });
      const wrapped = wrapWithEvents(engine, {});

      const result = wrapped.getModes({});
      expect(result).toEqual([{ name: "Classic" }]);
      expect(engine.getModes).toHaveBeenCalledOnce();
    });
  });
});

import type {
  GameState,
  GameWithNextAction,
  GameWithNextStep,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { wrapWithEvents } from "@core/useCases/gameEvents.js";
import { describe, expect, test, vi } from "vitest";

// ─── Mock Engine ─────────────────────────────────────────────────────

const stepGame = (step: string, turn = 0): GameWithNextStep =>
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  ({ id: "g1", turn, nextAction: { type: "step", step } }) as any;

const actionGame = (action: string, turn = 1): GameWithNextAction =>
  ({
    id: "g1",
    turn,
    nextAction: { type: "action", nextLord: "lord1", nextAction: action },
    // biome-ignore lint/suspicious/noExplicitAny: test mock
  }) as any;

const resultGame = (): GameState =>
  // biome-ignore lint/suspicious/noExplicitAny: test mock
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
    // biome-ignore lint/suspicious/noExplicitAny: test mock
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

    // ─── Queendomino Events ──────────────────────────���───────────────

    test("should call onKnightPlaced after placeKnight", () => {
      const onKnightPlaced = vi.fn();
      const engine = createMockEngine({
        placeKnight: vi
          .fn()
          .mockReturnValue(actionGame("constructBuilding", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onKnightPlaced });

      wrapped.placeKnight({
        game: actionGame("placeKnight", 1),
        lordId: "lord1",
        position: { x: 3, y: 4 },
      });

      expect(onKnightPlaced).toHaveBeenCalledWith({
        game: actionGame("constructBuilding", 1),
        lordId: "lord1",
      });
    });

    test("should call onBuildingConstructed after constructBuilding", () => {
      const onBuildingConstructed = vi.fn();
      const engine = createMockEngine({
        constructBuilding: vi.fn().mockReturnValue(actionGame("useDragon", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onBuildingConstructed });

      wrapped.constructBuilding({
        game: actionGame("constructBuilding", 1),
        lordId: "lord1",
        buildingId: 7,
        position: { x: 3, y: 4 },
      });

      expect(onBuildingConstructed).toHaveBeenCalledWith({
        game: actionGame("useDragon", 1),
        lordId: "lord1",
        buildingId: 7,
      });
    });

    test("should call onDragonUsed after useDragon", () => {
      const onDragonUsed = vi.fn();
      const engine = createMockEngine({
        useDragon: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onDragonUsed });

      wrapped.useDragon({
        game: actionGame("useDragon", 1),
        lordId: "lord1",
        buildingId: 3,
      });

      expect(onDragonUsed).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        buildingId: 3,
      });
    });

    // ─── Origins Events ─────────────────────────────────────────────

    test("should call onFireTokenPlaced after placeFireToken", () => {
      const onFireTokenPlaced = vi.fn();
      const engine = createMockEngine({
        placeFireToken: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onFireTokenPlaced });

      wrapped.placeFireToken({
        game: actionGame("placeFireToken", 1),
        lordId: "lord1",
        position: { x: 3, y: 4 },
      });

      expect(onFireTokenPlaced).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
      });
    });

    test("should call onCavemanRecruited after recruitCaveman", () => {
      const onCavemanRecruited = vi.fn();
      const engine = createMockEngine({
        recruitCaveman: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onCavemanRecruited });

      wrapped.recruitCaveman({
        game: actionGame("recruitCaveman", 1),
        lordId: "lord1",
        cavemanId: 5,
        position: { x: 3, y: 4 },
        resourcePositions: [
          { x: 2, y: 3 },
          { x: 4, y: 5 },
        ],
      });

      expect(onCavemanRecruited).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        cavemanId: 5,
      });
    });

    // ─── Age of Giants Events ───────��───────────────────────────────

    test("should call onGiantPlaced after placeGiant", () => {
      const onGiantPlaced = vi.fn();
      const engine = createMockEngine({
        placeGiant: vi.fn().mockReturnValue(actionGame("sendGiant", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onGiantPlaced });

      wrapped.placeGiant({
        game: actionGame("placeGiant", 1),
        lordId: "lord1",
        position: { x: 3, y: 4 },
      });

      expect(onGiantPlaced).toHaveBeenCalledWith({
        game: actionGame("sendGiant", 1),
        lordId: "lord1",
      });
    });

    test("should call onGiantSent after sendGiant", () => {
      const onGiantSent = vi.fn();
      const engine = createMockEngine({
        sendGiant: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
      });
      const wrapped = wrapWithEvents(engine, { onGiantSent });

      wrapped.sendGiant({
        game: actionGame("sendGiant", 1),
        lordId: "lord1",
        giantIndex: 0,
        targetPlayerId: "player2",
        targetCrownPosition: { x: 5, y: 5 },
      });

      expect(onGiantSent).toHaveBeenCalledWith({
        game: actionGame("pickDomino", 1),
        lordId: "lord1",
        targetPlayerId: "player2",
      });
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

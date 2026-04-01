import {
  type GameState,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { DebugLogEntry, DebugLogger } from "@core/useCases/gameDebug.js";
import { describe, expect, test, vi } from "vitest";
import { createGameEngine } from "../../index.js";

const createSpyLogger = (): {
  logger: DebugLogger;
  entries: DebugLogEntry[];
} => {
  const entries: DebugLogEntry[] = [];
  return {
    logger: { log: (entry: DebugLogEntry) => entries.push(entry) },
    entries,
  };
};

const playFullGame = (
  engine: ReturnType<typeof createGameEngine>,
): GameState => {
  let game: GameState = engine.createGame({ mode: "Classic" });
  game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
  game = engine.startGame({ game });

  while (isGameWithNextAction(game)) {
    const lordId = game.nextAction.nextLord;
    const action = game.nextAction.nextAction;

    if (action === "placeDomino") {
      const lord = game.lords.find((l) => l.id === lordId);
      const player = game.players.find((p) => p.id === lord?.playerId);
      const domino = lord?.dominoPicked;
      if (!player || !domino) break;

      const validPlacements = engine.getValidPlacements({
        kingdom: player.kingdom,
        domino,
      });

      if (validPlacements.length > 0) {
        const placement = validPlacements[0];
        if (!placement) break;
        game = engine.placeDomino({
          game,
          lordId,
          position: placement.position,
          rotation: placement.rotation,
        });
      } else {
        game = engine.discardDomino({ game, lordId });
      }
    } else if (action === "pickDomino") {
      const available = game.currentDominoes.find((d) => !d.picked);
      if (!available) break;
      game = engine.chooseDomino({
        game,
        lordId,
        dominoPick: available.domino.number,
      });
    } else {
      game = engine.discardDomino({ game, lordId });
    }
  }

  return game;
};

describe("GameDebug e2e", () => {
  test("should log all engine operations during a complete game", () => {
    const { logger, entries } = createSpyLogger();

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      debug: { logger, level: "standard" },
    });

    playFullGame(engine);

    // Every entry should alternate before/after (or before/error)
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.length % 2).toBe(0);

    for (let i = 0; i < entries.length; i += 2) {
      expect(entries[i]?.phase).toBe("before");
      expect(entries[i + 1]?.phase).toMatch(/^(after|error)$/);
      expect(entries[i]?.method).toBe(entries[i + 1]?.method);
    }
  });

  test("should capture correct methods in order", () => {
    const { logger, entries } = createSpyLogger();

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      debug: { logger },
    });

    playFullGame(engine);

    const methods = entries
      .filter((e) => e.phase === "before")
      .map((e) => e.method);

    // Game always starts with these 3 methods
    expect(methods[0]).toBe("createGame");
    expect(methods[1]).toBe("addPlayers");
    expect(methods[2]).toBe("startGame");

    // Should contain gameplay methods
    expect(methods).toContain("chooseDomino");
    expect(
      methods.some((m) => m === "placeDomino" || m === "discardDomino"),
    ).toBe(true);
  });

  test("should show game progression in summaries", () => {
    const { logger, entries } = createSpyLogger();

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      debug: { logger, level: "standard" },
    });

    playFullGame(engine);

    // After createGame: turn=0
    const afterCreate = entries.find(
      (e) => e.method === "createGame" && e.phase === "after",
    );
    expect(afterCreate?.summary?.turn).toBe(0);
    expect(afterCreate?.summary?.nextAction).toBe("step:addPlayers");

    // After addPlayers: should have 2 players
    const afterAdd = entries.find(
      (e) => e.method === "addPlayers" && e.phase === "after",
    );
    expect(afterAdd?.summary?.playersCount).toBe(2);

    // After startGame: turn should be 0 and action should be pickDomino
    const afterStart = entries.find(
      (e) => e.method === "startGame" && e.phase === "after",
    );
    expect(afterStart?.summary?.turn).toBe(0);
    expect(afterStart?.summary?.nextAction).toBe("action:pickDomino");
  });

  test("should include duration for all after entries", () => {
    const { logger, entries } = createSpyLogger();

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      debug: { logger },
    });

    playFullGame(engine);

    const afterEntries = entries.filter((e) => e.phase === "after");
    for (const entry of afterEntries) {
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  test("should work with debug: true shorthand", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      debug: true,
    });

    engine.createGame({ mode: "Classic" });

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0]?.[0]).toContain("[KDomino:Debug]");

    consoleSpy.mockRestore();
  });
});

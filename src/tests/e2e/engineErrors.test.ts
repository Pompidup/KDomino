import { createGameEngine } from "../../index";
import type { GameEngine } from "@core/portUserside/engine.js";
import { beforeAll, describe, expect, test } from "vitest";

describe("Engine - Error paths", () => {
  let engine: GameEngine;
  beforeAll(() => {
    engine = createGameEngine({});
  });

  test("should throw when creating game with invalid mode", () => {
    expect(() => engine.createGame({ mode: "Invalid" })).toThrow();
  });

  test("should throw when adding players to a started game", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    const started = engine.startGame({ game: withPlayers });

    expect(() =>
      engine.addPlayers({ game: started, players: ["Eve", "Dan"] })
    ).toThrow();
  });

  test("should throw when adding too few players", () => {
    const game = engine.createGame({ mode: "Classic" });

    expect(() =>
      engine.addPlayers({ game, players: [] })
    ).toThrow();
  });

  test("should throw when adding too many players", () => {
    const game = engine.createGame({ mode: "Classic" });

    expect(() =>
      engine.addPlayers({
        game,
        players: ["Alice", "Bobby", "Carol", "David", "Extra"],
      })
    ).toThrow();
  });

  test("should throw when adding player with short name", () => {
    const game = engine.createGame({ mode: "Classic" });

    expect(() =>
      engine.addPlayers({ game, players: ["Al", "Bobby"] })
    ).toThrow();
  });

  test("should throw when choosing a domino that is already picked", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    const started = engine.startGame({ game: withPlayers });

    const firstLordId = started.nextAction.nextLord;
    const dominoNumber = started.currentDominoes[0]!.domino.number;

    const afterPick = engine.chooseDomino({
      game: started,
      lordId: firstLordId,
      dominoPick: dominoNumber,
    });

    const secondLordId = afterPick.nextAction.nextLord;

    expect(() =>
      engine.chooseDomino({
        game: afterPick,
        lordId: secondLordId,
        dominoPick: dominoNumber,
      })
    ).toThrow();
  });

  test("should throw when wrong lord tries to pick", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    const started = engine.startGame({ game: withPlayers });

    const wrongLordId = started.lords[1]!.id;
    const dominoNumber = started.currentDominoes[0]!.domino.number;

    expect(() =>
      engine.chooseDomino({
        game: started,
        lordId: wrongLordId,
        dominoPick: dominoNumber,
      })
    ).toThrow();
  });

  test("should throw when placing domino on occupied position", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    let current = engine.startGame({ game: withPlayers });

    // All 4 lords pick dominoes
    for (let i = 0; i < 4; i++) {
      const lordId = current.nextAction.nextLord;
      const domino = current.currentDominoes[i]!.domino;
      current = engine.chooseDomino({
        game: current,
        lordId,
        dominoPick: domino.number,
      });
    }

    // Try to place on the castle position (4,4)
    const lordId = current.nextAction.nextLord;
    expect(() =>
      engine.placeDomino({
        game: current,
        lordId,
        position: { x: 4, y: 4 },
        rotation: 0,
      })
    ).toThrow();
  });

  test("should throw when placing domino out of grid bounds", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    let current = engine.startGame({ game: withPlayers });

    for (let i = 0; i < 4; i++) {
      const lordId = current.nextAction.nextLord;
      const domino = current.currentDominoes[i]!.domino;
      current = engine.chooseDomino({
        game: current,
        lordId,
        dominoPick: domino.number,
      });
    }

    const lordId = current.nextAction.nextLord;
    expect(() =>
      engine.placeDomino({
        game: current,
        lordId,
        position: { x: 8, y: 4 },
        rotation: 0,
      })
    ).toThrow();
  });

  test("should throw when getting results before game ends", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    const started = engine.startGame({ game: withPlayers });

    expect(() => engine.getResults({ game: started })).toThrow();
  });
});

import { validateGameState } from "@core/domain/entities/validateGameState.js";
import {
  type GameState,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { playBotTurn, randomStrategy } from "@core/useCases/bot.js";
import { getStrategy } from "@core/useCases/botRegistry.js";
import { beforeAll, describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

describe("validateGameState - e2e", () => {
  let engine: GameEngine;
  beforeAll(() => {
    engine = createGameEngine({});
  });

  test("returns no issues for a freshly created game", () => {
    const game = engine.createGame({ mode: "Classic" });
    const issues = validateGameState(game);
    expect(issues).toEqual([]);
  });

  test("returns no issues after adding players", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    const issues = validateGameState(withPlayers);
    expect(issues).toEqual([]);
  });

  test("returns no issues after starting the game", () => {
    const game = engine.createGame({ mode: "Classic" });
    const withPlayers = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    const started = engine.startGame({ game: withPlayers });
    const issues = validateGameState(started);
    expect(issues).toEqual([]);
  });

  test("returns no issues during mid-game state", () => {
    const engine = createGameEngine({
      shuffleMethod: (array) => array,
    });
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "e2e-validate",
    });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
    game = engine.startGame({ game });

    // Play a few pick/place rounds
    let moves = 0;
    while (isGameWithNextAction(game) && moves < 8) {
      const action = game.nextAction;

      if (action.nextAction === "pickDomino") {
        const available = game.currentDominoes.find((d) => !d.picked);
        if (!available) break;
        game = engine.chooseDomino({
          game,
          lordId: action.nextLord,
          dominoPick: available.domino.number,
        });
      } else if (action.nextAction === "placeDomino") {
        const lord = game.lords.find((l) => l.id === action.nextLord);
        if (!lord?.dominoPicked) break;
        const player = game.players.find((p) => p.id === lord.playerId);
        if (!player) break;

        const placements = engine.getValidPlacements({
          kingdom: player.kingdom,
          domino: lord.dominoPicked,
        });
        if (placements.length > 0) {
          const p = placements[0]!;
          game = engine.placeDomino({
            game,
            lordId: action.nextLord,
            position: p.position,
            rotation: p.rotation,
          });
        } else {
          game = engine.discardDomino({ game, lordId: action.nextLord });
        }
      } else {
        game = engine.discardDomino({ game, lordId: action.nextLord });
      }
      moves++;
    }

    const issues = validateGameState(game);
    expect(issues).toEqual([]);
  });
});

describe("validateGameState - complete games in every mode (#32)", () => {
  const MODES = [
    "Classic",
    "QueenDomino",
    "KingdominoOrigins-Discovery",
    "KingdominoOrigins-Totem",
    "KingdominoOrigins-Tribe",
    "AgeOfGiants",
    "AgeOfGiants-QueenDomino",
  ];

  /**
   * Every state the engine reaches must be valid, as is and after a
   * serialize / deserialize round trip.
   */
  const expectValid = (
    engine: GameEngine,
    game: GameState,
    label: string,
  ): void => {
    expect(validateGameState(game), label).toEqual([]);
    const restored = engine.deserialize({
      json: engine.serialize({ game }),
    });
    expect(restored, `${label} (deserialized)`).toEqual(game);
    expect(validateGameState(restored), `${label} (deserialized)`).toEqual([]);
  };

  test.each(MODES)("every state of a complete %s game is valid", {
    timeout: 60_000,
  }, (mode) => {
    const engine = createGameEngine({});
    let game: GameState = engine.createGame({
      mode,
      seed: `validate-${mode}`,
    });
    expectValid(engine, game, "created");
    game = engine.addPlayers({
      game,
      players: [
        { name: "Random", bot: { strategyName: "random" } },
        { name: "Greedy", bot: { strategyName: "greedy" } },
        { name: "Random2", bot: { strategyName: "random" } },
      ],
    });
    expectValid(engine, game, "players added");
    game = engine.startGame({ game });
    expectValid(engine, game, "started");

    let moves = 0;
    while (isGameWithNextAction(game)) {
      const current = game;
      const lord = current.lords.find(
        (l) => l.id === current.nextAction.nextLord,
      );
      const player = current.players.find((p) => p.id === lord?.playerId);
      const strategy =
        getStrategy(player?.bot?.strategyName ?? "random") ?? randomStrategy;
      game = playBotTurn(engine, current, strategy);
      moves++;
      expectValid(engine, game, `after move ${moves}`);
      expect(moves).toBeLessThan(2000);
    }

    expect(game.nextAction).toEqual({ type: "step", step: "result" });
  });

  test.each([
    "AgeOfGiants",
    "AgeOfGiants-QueenDomino",
  ])("a freshly created %s game, with its letter dominoes A-F, is valid", (mode) => {
    const engine = createGameEngine({});
    const game = engine.createGame({ mode });
    expect(
      game.dominoes
        .filter((domino) => domino.letter !== undefined)
        .map((domino) => [domino.letter, domino.number]),
    ).toEqual([
      ["A", 0.01],
      ["B", 0.02],
      ["C", 0.03],
      ["D", 0.04],
      ["E", 0.05],
      ["F", 0.06],
    ]);
    expect(validateGameState(game)).toEqual([]);
  });
});

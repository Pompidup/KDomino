import { validateGameState } from "@core/domain/entities/validateGameState.js";
import {
  isGameWithNextAction,
  type GameState,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
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
    let game: GameState = engine.createGame({ mode: "Classic", seed: "e2e-validate" });
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

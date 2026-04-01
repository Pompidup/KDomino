import type { GameState } from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

describe("Origins Totem Mode Full Game Simulation", () => {
  test("should simulate a complete 2-player Totem game", () => {
    const engine = createGameEngine({});
    const players = ["Grok", "Thag"];
    let game: GameState;

    // Create game in Origins Totem mode
    game = engine.createGame({
      mode: "KingdominoOrigins-Totem",
      seed: "origins-totem-test",
    });
    expect(game.mode.name).toBe("KingdominoOrigins-Totem");
    expect(game.origins).toBeDefined();
    expect(game.origins?.subMode).toBe("Totem");
    expect(game.origins?.totems).toEqual({
      mammoth: null,
      fish: null,
      mushroom: null,
      flint: null,
    });

    // Add players
    game = engine.addPlayers({ game, players });
    expect(game.players).toHaveLength(2);
    expect(game.players[0]?.fireTokens).toEqual([]);
    expect(game.players[0]?.resources).toEqual([]);

    // Start game
    game = engine.startGame({ game });

    // Game loop
    let iterations = 0;
    const maxIterations = 500;

    while (isGameWithNextAction(game) && iterations < maxIterations) {
      iterations++;
      const action = game.nextAction.nextAction;
      const lordId = game.nextAction.nextLord;

      if (action === playerActions.pickDomino) {
        const unpicked = game.currentDominoes.find((d) => !d.picked);
        if (!unpicked) break;
        game = engine.chooseDomino({
          game,
          lordId,
          dominoPick: unpicked.domino.number,
        });
      } else if (action === playerActions.placeDomino) {
        const lord = game.lords.find((l) => l.id === lordId);
        const player = game.players.find((p) => p.id === lord?.playerId);
        if (!lord?.dominoPicked || !player) break;

        const placements = engine.getValidPlacements({
          kingdom: player.kingdom,
          domino: lord.dominoPicked,
        });

        if (placements.length > 0) {
          game = engine.placeDomino({
            game,
            lordId,
            position: placements[0]!.position,
            rotation: placements[0]!.rotation,
          });
        } else {
          game = engine.discardDomino({ game, lordId });
        }
      } else if (action === playerActions.pass) {
        game = engine.discardDomino({ game, lordId });
      } else if (action === playerActions.placeFireToken) {
        game = engine.skipOptionalAction({ game, lordId });
      }
    }

    expect(iterations).toBeLessThan(maxIterations);

    // Verify players collected some resources during the game
    const player1Resources = game.players[0]?.resources ?? [];
    const player2Resources = game.players[1]?.resources ?? [];
    // At least some resources should have been collected
    expect(player1Resources.length + player2Resources.length).toBeGreaterThan(
      0,
    );

    // Get results
    const results = engine.getResults({ game });
    expect(results.result).toBeDefined();
    expect(results.result).toHaveLength(2);
    expect(results.result[0]?.position).toBe(1);
  });

  test("should create Totem mode with proper initial state", () => {
    const engine = createGameEngine({});
    const game = engine.createGame({
      mode: "KingdominoOrigins-Totem",
    });

    expect(game.origins).toBeDefined();
    expect(game.origins?.subMode).toBe("Totem");
    expect(game.origins?.totems).toBeDefined();
    expect(game.origins?.caveBoard).toBeUndefined();
  });
});

import type { GameState } from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

describe("Origins Tribe Mode Full Game Simulation", () => {
  test("should simulate a complete 2-player Tribe game", () => {
    const engine = createGameEngine({});
    const players = ["Grok", "Thag"];
    let game: GameState;

    // Create game in Origins Tribe mode
    game = engine.createGame({
      mode: "KingdominoOrigins-Tribe",
      seed: "origins-tribe-test",
    });
    expect(game.mode.name).toBe("KingdominoOrigins-Tribe");
    expect(game.origins).toBeDefined();
    expect(game.origins?.subMode).toBe("Tribe");
    expect(game.origins?.caveBoard).toBeDefined();
    expect(game.origins?.caveBoard?.drawPile.length).toBeGreaterThan(0);

    // Add players
    game = engine.addPlayers({ game, players });
    expect(game.players).toHaveLength(2);
    expect(game.players[0]?.fireTokens).toEqual([]);
    expect(game.players[0]?.resources).toEqual([]);
    expect(game.players[0]?.cavemen).toEqual([]);

    // Start game - cave board should be initialized
    game = engine.startGame({ game });
    expect(game.origins?.caveBoard?.visible.length).toBe(4);

    // Game loop
    let iterations = 0;
    const maxIterations = 500;
    let recruitCavemanEncountered = false;

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
      } else if (action === playerActions.recruitCaveman) {
        recruitCavemanEncountered = true;
        // Skip recruitment in this basic simulation
        game = engine.skipOptionalAction({ game, lordId });
      }
    }

    expect(iterations).toBeLessThan(maxIterations);

    // In Tribe mode, after each pick, the lord gets a recruitCaveman action
    expect(recruitCavemanEncountered).toBe(true);

    // Get results
    const results = engine.getResults({ game });
    expect(results.result).toBeDefined();
    expect(results.result).toHaveLength(2);
    expect(results.result[0]?.position).toBe(1);
  });

  test("should create Tribe mode with proper initial state", () => {
    const engine = createGameEngine({});
    const game = engine.createGame({
      mode: "KingdominoOrigins-Tribe",
    });

    expect(game.origins).toBeDefined();
    expect(game.origins?.subMode).toBe("Tribe");
    expect(game.origins?.caveBoard).toBeDefined();
    // 22 caveman tiles total in the draw pile before startGame
    expect(game.origins?.caveBoard?.drawPile).toHaveLength(22);
    expect(game.origins?.caveBoard?.visible).toHaveLength(0);
    expect(game.origins?.totems).toBeUndefined();
  });

  test("should have recruitCaveman action after picking a domino", () => {
    const engine = createGameEngine({});
    let game: GameState = engine.createGame({
      mode: "KingdominoOrigins-Tribe",
      seed: "tribe-recruit-test",
    });
    game = engine.addPlayers({ game, players: ["Grok", "Thag"] });
    game = engine.startGame({ game });

    // First lord picks a domino
    if (!isGameWithNextAction(game)) return;
    const firstLordId = game.nextAction.nextLord;
    const firstDomino = game.currentDominoes[0]!.domino;
    game = engine.chooseDomino({
      game,
      lordId: firstLordId,
      dominoPick: firstDomino.number,
    });

    // After picking in Tribe mode, next action should be recruitCaveman
    if (isGameWithNextAction(game)) {
      expect(game.nextAction.nextAction).toBe(playerActions.recruitCaveman);
      expect(game.nextAction.nextLord).toBe(firstLordId);
    }
  });
});

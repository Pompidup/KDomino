import type { GameState } from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

describe("Queendomino Full Game Simulation", () => {
  test("should simulate a complete 2-player QueenDomino game", () => {
    const engine = createGameEngine({});
    const players = ["Alice", "Bobby"];
    let game: GameState;

    // Create game in QueenDomino mode
    game = engine.createGame({ mode: "QueenDomino", seed: "qd-test-seed" });
    expect(game.mode.name).toBe("QueenDomino");
    expect(game.dominoes).toHaveLength(48);
    expect(game.queendomino).toBeDefined();
    expect(game.queendomino?.buildersBoard.drawPile.length).toBeGreaterThan(0);

    // Add players
    game = engine.addPlayers({ game, players });
    expect(game.players).toHaveLength(2);
    expect(game.players[0]?.coins).toBe(7);
    expect(game.players[0]?.towers).toBe(0);
    expect(game.players[0]?.knights).toEqual([]);
    expect(game.players[0]?.buildings).toEqual([]);

    // Start game
    game = engine.startGame({ game });
    expect(game.queendomino?.buildersBoard.slots.length).toBe(4);

    // Game loop
    const _turnCount = 0;
    const maxIterations = 500;
    let iterations = 0;

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
      } else if (
        action === playerActions.placeKnight ||
        action === playerActions.constructBuilding ||
        action === playerActions.useDragon
      ) {
        // Skip all optional actions for this simulation
        game = engine.skipOptionalAction({ game, lordId });
      } else if (action === playerActions.skipOptionalAction) {
        game = engine.skipOptionalAction({ game, lordId });
      }
    }

    expect(iterations).toBeLessThan(maxIterations);

    // Get results
    const results = engine.getResults({ game });
    expect(results.result).toBeDefined();
    expect(results.result).toHaveLength(2);
    expect(results.result[0]?.position).toBe(1);
    expect(results.result[1]?.position).toBe(2);
  });

  test("should create a QueenDomino game with proper initial state", () => {
    const engine = createGameEngine({});
    const game = engine.createGame({ mode: "QueenDomino" });

    expect(game.queendomino).toBeDefined();
    expect(game.queendomino?.dragonAvailable).toBe(true);
    expect(game.queendomino?.dragonUsedThisRound).toBe(false);
    expect(game.queendomino?.queenHolderId).toBeNull();
  });

  test("should show QueenDomino mode in available modes", () => {
    const engine = createGameEngine({});
    const modes = engine.getModes({});
    expect(modes.map((m) => m.name)).toContain("QueenDomino");
  });

  test("should have optional actions after placing domino in QueenDomino", () => {
    const engine = createGameEngine({});
    let game: GameState = engine.createGame({
      mode: "QueenDomino",
      seed: "test-actions",
    });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
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

    // All lords pick
    while (
      isGameWithNextAction(game) &&
      game.nextAction.nextAction === playerActions.pickDomino
    ) {
      const lordId = game.nextAction.nextLord;
      const unpicked = game.currentDominoes.find((d) => !d.picked);
      if (!unpicked) break;
      game = engine.chooseDomino({
        game,
        lordId,
        dominoPick: unpicked.domino.number,
      });
    }

    // First lord should now place domino
    if (
      !isGameWithNextAction(game) ||
      game.nextAction.nextAction !== playerActions.placeDomino
    ) {
      return;
    }

    const placeLordId = game.nextAction.nextLord;
    const lord = game.lords.find((l) => l.id === placeLordId);
    const player = game.players.find((p) => p.id === lord?.playerId);
    if (!lord?.dominoPicked || !player) return;

    const placements = engine.getValidPlacements({
      kingdom: player.kingdom,
      domino: lord.dominoPicked,
    });

    if (placements.length > 0) {
      game = engine.placeDomino({
        game,
        lordId: placeLordId,
        position: placements[0]!.position,
        rotation: placements[0]!.rotation,
      });

      // After placing domino in QueenDomino, next action should be placeKnight
      if (isGameWithNextAction(game)) {
        expect(game.nextAction.nextAction).toBe(playerActions.placeKnight);
        expect(game.nextAction.nextLord).toBe(placeLordId);
      }
    }
  });
});

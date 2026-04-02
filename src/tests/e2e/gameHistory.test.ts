import {
  type GameState,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import {
  canRedo,
  canUndo,
  createGameHistory,
  pushState,
  redo,
  undo,
} from "@core/useCases/gameHistory.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

describe("GameHistory e2e", () => {
  test("should track undo/redo through a real game flow", () => {
    const engine = createGameEngine({
      shuffleMethod: (array) => array,
    });

    // Setup phase
    let game: GameState = engine.createGame({ mode: "Classic" });
    let history = createGameHistory(game);

    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    history = pushState(history, game);

    game = engine.startGame({ game });
    history = pushState(history, game);

    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);

    // Play a few actions and track them
    const statesPlayed: GameState[] = [game];

    let actionsTracked = 0;
    while (isGameWithNextAction(game) && actionsTracked < 4) {
      const currentLordId = game.nextAction.nextLord;
      const nextAction = game.nextAction.nextAction;

      if (nextAction === "placeDomino") {
        const currentLord = game.lords.find((l) => l.id === currentLordId)!;
        const currentPlayer = game.players.find(
          (p) => p.id === currentLord.playerId,
        )!;
        const domino = currentLord.dominoPicked!;
        const validPlacements = engine.getValidPlacements({
          kingdom: currentPlayer.kingdom,
          domino,
        });

        if (validPlacements.length > 0) {
          const placement = validPlacements[0]!;
          game = engine.placeDomino({
            game,
            lordId: currentLordId,
            position: placement.position,
            rotation: placement.rotation,
          });
        } else {
          game = engine.discardDomino({ game, lordId: currentLordId });
        }

        history = pushState(history, game);
        statesPlayed.push(game);
        actionsTracked++;
      } else if (nextAction === "pickDomino") {
        const availableDomino = game.currentDominoes.find((d) => !d.picked);
        if (!availableDomino) break;

        game = engine.chooseDomino({
          game,
          lordId: currentLordId,
          dominoPick: availableDomino.domino.number,
        });

        history = pushState(history, game);
        statesPlayed.push(game);
        actionsTracked++;
      } else {
        break;
      }
    }

    expect(actionsTracked).toBeGreaterThan(0);

    // Undo all tracked actions
    for (let i = 0; i < actionsTracked; i++) {
      expect(canUndo(history)).toBe(true);
      history = undo(history);
    }

    // Current should be back to the state after startGame
    expect(history.current.turn).toBe(statesPlayed[0]!.turn);
    expect(canRedo(history)).toBe(true);

    // Redo all
    for (let i = 0; i < actionsTracked; i++) {
      history = redo(history);
    }

    // Current should match the last played state
    expect(history.current).toBe(statesPlayed[statesPlayed.length - 1]);
    expect(canRedo(history)).toBe(false);
  });

  test("should discard future when pushing after undo", () => {
    const engine = createGameEngine({
      shuffleMethod: (array) => array,
    });

    let game: GameState = engine.createGame({ mode: "Classic" });
    let history = createGameHistory(game);

    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    history = pushState(history, game);

    game = engine.startGame({ game });
    history = pushState(history, game);

    // Undo back to addPlayers state
    history = undo(history);
    expect(canRedo(history)).toBe(true);

    // Push a new state (re-start with different options would be a real case)
    // Here we just push the same startGame result to test the branching
    const altGame = engine.startGame({ game: history.current });
    history = pushState(history, altGame);

    // Future should be cleared
    expect(canRedo(history)).toBe(false);
    expect(history.future).toEqual([]);
  });
});

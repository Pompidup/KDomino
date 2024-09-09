import { createGameEngine } from "../../index.js";
import {
  isGameWithNextAction,
  type GameState,
} from "@core/domain/types/game.js";
import { describe, expect, test } from "vitest";

describe("Full Game Simulation", () => {
  test("should simulate a complete 2-player game", () => {
    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      logging: true,
    });
    const players = ["Alice", "Bob"];
    let game: GameState;

    // Create game
    game = engine.createGame({ mode: "Classic" });

    // Add players
    game = engine.addPlayers({ game, players });

    // Start game
    game = engine.startGame({ game });

    // Simulate turns until the game is over
    while (isGameWithNextAction(game)) {
      for (let i = 0; i < 4; i++) {
        const allLordIds = game.lords.map((lord) => lord.id);
        const positions = [
          { x: 5, y: 4 },
          { x: 2, y: 4 },
          { x: 4, y: 3 },
          { x: 4, y: 5 },
        ];

        if (!isGameWithNextAction(game)) break;

        let currentLordId = game.nextAction.nextLord;
        let nextAction = game.nextAction.nextAction;

        if (nextAction == "placeDomino") {
          if (game.turn === 1) {
            if (allLordIds.includes(currentLordId)) {
              game = engine.placeDomino({
                game,
                lordId: currentLordId,
                position: positions[i]!,
                orientation: "horizontal",
                rotation: 0,
              });
              allLordIds.splice(allLordIds.indexOf(currentLordId), 1);
            }
          } else {
            game = engine.discardDomino({
              game,
              lordId: currentLordId,
            });
          }
        }

        if (!isGameWithNextAction(game)) break;

        currentLordId = game.nextAction.nextLord;
        nextAction = game.nextAction.nextAction;

        if (nextAction == "pickDomino") {
          game = engine.chooseDomino({
            game,
            lordId: currentLordId,
            dominoPick: game.currentDominoes[i]!.domino.number,
          });
        }
      }
    }

    // Get results
    const gameResult = engine.getResults({ game });

    // Assert that we have results for both players
    expect(gameResult.result.length).toBe(2);
  });
});

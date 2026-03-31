import { createGameEngine } from "../../index.js";
import {
  isGameWithNextAction,
  type GameState,
} from "@core/domain/types/game.js";
import type { GameEventCallbacks } from "@core/useCases/gameEvents.js";
import { describe, expect, test, vi } from "vitest";

describe("GameEvents e2e", () => {
  test("should emit all events during a complete 2-player game", () => {
    const callbacks: Required<{
      [K in keyof GameEventCallbacks]: ReturnType<typeof vi.fn>;
    }> = {
      onGameCreated: vi.fn(),
      onPlayersAdded: vi.fn(),
      onGameStarted: vi.fn(),
      onDominoPicked: vi.fn(),
      onDominoPlaced: vi.fn(),
      onDominoDiscarded: vi.fn(),
      onTurnStart: vi.fn(),
      onTurnEnd: vi.fn(),
      onGameEnd: vi.fn(),
    };

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      events: callbacks,
    });

    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    game = engine.startGame({ game });

    while (isGameWithNextAction(game)) {
      const lordId = game.nextAction.nextLord;
      const action = game.nextAction.nextAction;

      if (action === "placeDomino") {
        const lord = game.lords.find((l) => l.id === lordId)!;
        const player = game.players.find((p) => p.id === lord.playerId)!;
        const domino = lord.dominoPicked!;
        const validPlacements = engine.getValidPlacements({
          kingdom: player.kingdom,
          domino,
        });

        if (validPlacements.length > 0) {
          const placement = validPlacements[0]!;
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

    // Setup events
    expect(callbacks.onGameCreated).toHaveBeenCalledOnce();
    expect(callbacks.onPlayersAdded).toHaveBeenCalledOnce();
    expect(callbacks.onGameStarted).toHaveBeenCalledOnce();

    // Game end
    expect(callbacks.onGameEnd).toHaveBeenCalledOnce();

    // Turn events: game starts at turn 0, then transitions through turns 1-6
    // onTurnStart: 1 from startGame (turn 0) + 6 from chooseDomino transitions = 7
    expect(callbacks.onTurnStart).toHaveBeenCalledTimes(7);
    // onTurnEnd: 6 (turns 0-5; turn 6 ends with onGameEnd)
    expect(callbacks.onTurnEnd).toHaveBeenCalledTimes(6);

    // Action events: every pick and place/discard should fire
    expect(callbacks.onDominoPicked.mock.calls.length).toBeGreaterThan(0);
    const totalPlacedOrDiscarded =
      callbacks.onDominoPlaced.mock.calls.length +
      callbacks.onDominoDiscarded.mock.calls.length;
    expect(totalPlacedOrDiscarded).toBeGreaterThan(0);
  });

  test("should work with partial callbacks (only some events)", () => {
    const onGameEnd = vi.fn();

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      events: { onGameEnd },
    });

    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    game = engine.startGame({ game });

    while (isGameWithNextAction(game)) {
      const lordId = game.nextAction.nextLord;
      const action = game.nextAction.nextAction;

      if (action === "placeDomino") {
        const lord = game.lords.find((l) => l.id === lordId)!;
        const player = game.players.find((p) => p.id === lord.playerId)!;
        const domino = lord.dominoPicked!;
        const validPlacements = engine.getValidPlacements({
          kingdom: player.kingdom,
          domino,
        });

        if (validPlacements.length > 0) {
          game = engine.placeDomino({
            game,
            lordId,
            position: validPlacements[0]!.position,
            rotation: validPlacements[0]!.rotation,
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

    expect(onGameEnd).toHaveBeenCalledOnce();
  });

  test("should emit events with correct turn numbers", () => {
    const turnStarts: number[] = [];
    const turnEnds: number[] = [];

    const engine = createGameEngine({
      shuffleMethod: (array) => array,
      events: {
        onTurnStart: ({ turn }) => turnStarts.push(turn),
        onTurnEnd: ({ turn }) => turnEnds.push(turn),
      },
    });

    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    game = engine.startGame({ game });

    while (isGameWithNextAction(game)) {
      const lordId = game.nextAction.nextLord;
      const action = game.nextAction.nextAction;

      if (action === "placeDomino") {
        const lord = game.lords.find((l) => l.id === lordId)!;
        const player = game.players.find((p) => p.id === lord.playerId)!;
        const domino = lord.dominoPicked!;
        const validPlacements = engine.getValidPlacements({
          kingdom: player.kingdom,
          domino,
        });

        if (validPlacements.length > 0) {
          game = engine.placeDomino({
            game,
            lordId,
            position: validPlacements[0]!.position,
            rotation: validPlacements[0]!.rotation,
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

    // Turns should be sequential: starts [0,1,2,3,4,5,6], ends [0,1,2,3,4,5]
    expect(turnStarts).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(turnEnds).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

import { isGameWithNextAction } from "@core/domain/types/game.js";
import type { GameState } from "@core/domain/types/index.js";
import {
  getActions,
  getActionsByTurn,
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const playFullGame = (
  engine: ReturnType<typeof createGameEngine>,
): GameState => {
  let game: GameState = engine.createGame({ mode: "Classic", seed: "e2e-log" });
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

describe("GameActionLog e2e", () => {
  test("should record all actions during a complete game", () => {
    const baseEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });
    const { engine, getLog } = wrapWithActionLog(baseEngine);

    playFullGame(engine);

    const log = getLog();
    const actions = getActions(log);

    // Should have recorded actions
    expect(actions.length).toBeGreaterThan(0);

    // First action must be createGame
    expect(actions[0]?.action).toBe("createGame");
    expect(actions[0]?.payload).toEqual({ mode: "Classic", seed: "e2e-log" });

    // Should contain setup actions
    expect(getActionsByType(log, "createGame")).toHaveLength(1);
    expect(getActionsByType(log, "addPlayers")).toHaveLength(1);
    expect(getActionsByType(log, "startGame")).toHaveLength(1);

    // Should contain gameplay actions
    expect(getActionsByType(log, "chooseDomino").length).toBeGreaterThan(0);

    const placedOrDiscarded =
      getActionsByType(log, "placeDomino").length +
      getActionsByType(log, "discardDomino").length;
    expect(placedOrDiscarded).toBeGreaterThan(0);

    // All entries should have sequential ids
    for (let i = 0; i < actions.length; i++) {
      expect(actions[i]?.id).toBe(i);
    }

    // gameId should be set
    expect(log.gameId).toBeTruthy();
  });

  test("should filter actions by turn", () => {
    const baseEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });
    const { engine, getLog } = wrapWithActionLog(baseEngine);

    playFullGame(engine);

    const log = getLog();

    // Turn 0 should have setup actions (createGame, addPlayers, startGame initial)
    const turn0 = getActionsByTurn(log, 0);
    expect(turn0.length).toBeGreaterThan(0);
    expect(turn0.every((e) => e.turn === 0)).toBe(true);
  });

  test("should replay a game and produce the same final state", () => {
    // Deterministic UUID so replay generates the same IDs
    let uuidCounter = 0;
    const deterministicUuid = () => `uuid-${++uuidCounter}`;

    const makeEngine = () => {
      uuidCounter = 0;
      return createGameEngine({
        shuffleMethod: (array) => array,
        uuidMethod: deterministicUuid,
      });
    };

    const baseEngine = makeEngine();
    const { engine, getLog } = wrapWithActionLog(baseEngine);

    const finalState = playFullGame(engine);
    const log = getLog();

    // Replay with a fresh engine using the same deterministic config
    const replayEngine = makeEngine();
    const replayedState = replayActions(replayEngine, log);

    // The replayed state should match the original final state
    expect(replayedState.id).toBe(finalState.id);
    expect(replayedState.turn).toBe(finalState.turn);
    expect(replayedState.players.length).toBe(finalState.players.length);

    // Compare player kingdoms (the core game state)
    for (let i = 0; i < finalState.players.length; i++) {
      expect(replayedState.players[i]?.kingdom).toEqual(
        finalState.players[i]?.kingdom,
      );
    }

    // Compare domino stacks
    expect(replayedState.dominoes.length).toBe(finalState.dominoes.length);
    expect(replayedState.currentDominoes).toEqual(finalState.currentDominoes);
  });

  test("should not record read-only operations", () => {
    const baseEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });
    const { engine, getLog } = wrapWithActionLog(baseEngine);

    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });

    // These should not be recorded
    engine.getModes({});
    engine.calculateScore({
      kingdom: game.players[0]?.kingdom ?? [],
    });

    const log = getLog();
    expect(getActions(log)).toHaveLength(2); // only createGame + addPlayers
  });

  test("addPlayers payload should not contain game state", () => {
    const baseEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });
    const { engine, getLog } = wrapWithActionLog(baseEngine);

    const game = engine.createGame({ mode: "Classic" });
    engine.addPlayers({ game, players: ["Alice", "Bob"] });

    const log = getLog();
    const addPlayersEntry = getActionsByType(log, "addPlayers")[0];

    // Payload should only contain players, NOT the game state
    expect(addPlayersEntry?.payload).toEqual({ players: ["Alice", "Bob"] });
    expect(addPlayersEntry?.payload).not.toHaveProperty("game");
  });
});

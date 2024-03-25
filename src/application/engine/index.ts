import inMemoryDominoes from "../../infrastructure/repositories/inMemoryDominoes.js";
import { availableMode, type Game } from "../../domain/entities/game.js";
import type {
  Orientation,
  Position,
  Rotation,
} from "../../domain/entities/kingdom.js";
import gameStep, {
  type GameDependencies,
} from "../../domain/useCases/game/game.js";
import {
  result,
  type FinalResult,
  type ScoreResult,
} from "../../domain/useCases/game/result.js";

export type Resp = {
  nextKing: string;
  nextAction: "pick" | "place" | "end";
  game: Game;
};

export type GameResult = {
  result: FinalResult[];
  game: Game;
};

/** Todo
 * Add rules step
 *
 **/

const gameEngine = () => {
  const dependencies: GameDependencies = {
    dominoesRepository: inMemoryDominoes(),
    uuidMethod: () => `uuid-${Math.random()}`,
    randomMethod: (array) => array,
  };

  const {
    init,
    setup,
    startTurn,
    pick,
    place,
    pass,
    definePlayerOrder,
    draw,
    calculateScore,
  } = gameStep(dependencies);

  /**
   * WIP
   **/
  const getMode = () => {
    return availableMode;
  };

  const setMode = (mode: string, game: Game) => {
    return game;
  };

  const getRules = (mode: string) => {
    return [];
  };

  const setRules = (rules: string[], game: Game) => {
    return game;
  };

  const start = (game: Game, players: { name: string }[]): Resp => {
    const setupState = setup({
      state: game,
      players,
    });
    const drawState = draw({ state: setupState });

    return {
      nextKing: drawState.kings[0]!.id,
      nextAction: "pick",
      game: drawState,
    };
  };

  const passTurn = (game: Game, kingId: string): Resp => {
    const updatedGame = pass({
      kingId,
      action: "pass",
      data: {
        state: game,
      },
    });

    const resp = defineNextAction(updatedGame, "pass", kingId);

    return resp;
  };

  const placeDomino = (
    game: Game,
    kingId: string,
    position: Position,
    orientation: Orientation,
    rotation: Rotation
  ): Resp => {
    const updatedGame = place({
      kingId,
      action: "place",
      data: {
        state: game,
        position,
        orientation,
        rotation,
      },
    });

    const resp = defineNextAction(updatedGame, "place", kingId);

    return resp;
  };

  const pickDomino = (game: Game, kingId: string, dominoPick: number): Resp => {
    const updatedGame = pick({
      kingId,
      action: "pick",
      data: {
        state: game,
        dominoPick,
      },
    });

    const resp = defineNextAction(updatedGame, "pick", kingId);

    return resp;
  };

  const prepareNextTurn = (game: Game): Game => {
    const updatedOrder = definePlayerOrder({ state: game });
    const updateDraw = draw({ state: updatedOrder });
    const updateTurn = startTurn({ state: updateDraw });

    if (updateTurn.game.turn > updateTurn.game.maxTurns) {
      throw new Error("Game is over");
    }

    return updateTurn.game;
  };

  const defineNextAction = (
    game: Game,
    currentAction: string,
    currentKingId: string
  ): Resp => {
    const { kings, turn } = game;

    if (turn === 0) {
      const nextKing = kings.find((king) => !king.hasPick);
      if (!nextKing) {
        const newState = prepareNextTurn(game);
        return {
          nextKing: newState.kings[0]!.id,
          nextAction: "place",
          game: newState,
        };
      }
      return {
        nextKing: nextKing.id,
        nextAction: "pick",
        game,
      };
    }

    if (currentAction === "place" || currentAction === "pass") {
      if (game.turn === game.maxTurns) {
        const nextKing = kings.find((king) => !king.hasPlace);
        if (!nextKing) {
          return {
            nextKing: "none",
            nextAction: "end",
            game,
          };
        }
        return {
          nextKing: nextKing!.id,
          nextAction: "place",
          game,
        };
      }
      return {
        nextKing: currentKingId,
        nextAction: "pick",
        game,
      };
    }

    const allKingsHavePicked = kings.every((king) => king.hasPick);

    if (allKingsHavePicked) {
      const newState = prepareNextTurn(game);
      return {
        nextKing: newState.order["1"]!,
        nextAction: "place",
        game: newState,
      };
    }

    const nextKing = kings.find((king) => !king.hasPlace);

    return {
      nextKing: nextKing!.id,
      nextAction: "place",
      game,
    };
  };

  const endGame = (game: Game): GameResult => {
    const players = game.players;
    const scores: ScoreResult[] = [];

    for (let player of players) {
      const score = calculateScore(player.kingdom);
      scores.push({
        playerId: player.id!,
        playerName: player.name,
        details: score,
      });
    }

    const finalResult = result(scores);

    return {
      result: finalResult,
      game,
    };
  };

  return {
    init,
    getMode,
    setMode,
    getRules,
    setRules,
    start,
    pass: passTurn,
    placeDomino,
    pickDomino,
    endGame,
  };
};

export default gameEngine;

// TODO
// Add rules step
// Add error handling
// Refactor game.js
// Manage env for injection of dependencies (uuid, random, etc.)
// Add variant available (queendomino, giant extension, dragonomino, etc.)

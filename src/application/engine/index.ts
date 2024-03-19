import inMemoryDominoes from "../../infrastructure/repositories/inMemoryDominoes.js";
import type { Game } from "../../domain/entities/game.js";
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
    order,
    draw,
    calculateScore,
  } = gameStep(dependencies);

  const start = async (players: { name: string }[]): Promise<Resp> => {
    const initState = await init();
    const setupState = await setup({
      state: initState,
      players,
    });
    const drawState = await draw({ state: setupState });

    return {
      nextKing: drawState.kings[0]!.id,
      nextAction: "pick",
      game: drawState,
    };
  };

  const passTurn = async (game: Game, kingId: string): Promise<Resp> => {
    const updatedGame = pass({
      kingId,
      action: "pass",
      data: {
        state: game,
      },
    });

    const resp = await defineNextAction(updatedGame, "pass", kingId);

    return resp;
  };

  const placeDomino = async (
    game: Game,
    kingId: string,
    position: Position,
    orientation: Orientation,
    rotation: Rotation
  ): Promise<Resp> => {
    const updatedGame = await place({
      kingId,
      action: "place",
      data: {
        state: game,
        position,
        orientation,
        rotation,
      },
    });

    const resp = await defineNextAction(updatedGame, "place", kingId);

    return resp;
  };

  const pickDomino = async (
    game: Game,
    kingId: string,
    dominoPick: number
  ): Promise<Resp> => {
    const updatedGame = await pick({
      kingId,
      action: "pick",
      data: {
        state: game,
        dominoPick,
      },
    });

    const resp = await defineNextAction(updatedGame, "pick", kingId);

    return resp;
  };

  const prepareNextTurn = async (game: Game): Promise<Game> => {
    const updatedOrder = await order({ state: game });
    const updateDraw = await draw({ state: updatedOrder });
    const updateTurn = await startTurn({ state: updateDraw });

    if (updateTurn.game.turn > updateTurn.game.maxTurns) {
      throw new Error("Game is over");
    }

    return updateTurn.game;
  };

  const defineNextAction = async (
    game: Game,
    currentAction: string,
    currentKingId: string
  ): Promise<Resp> => {
    const { kings, turn } = game;

    if (turn === 0) {
      const nextKing = kings.find((king) => !king.hasPick);
      if (!nextKing) {
        const newState = await prepareNextTurn(game);
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
      const newState = await prepareNextTurn(game);
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

  const endGame = async (game: Game): Promise<GameResult> => {
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
    start,
    pass: passTurn,
    placeDomino,
    pickDomino,
    endGame,
  };
};

export default gameEngine;

// TODO
// V Add pass action
// remove useless higher order functions
// Add rules step
// Add error handling
// V Refactor test helpers
// Refactor game.js
// Manage env for injection of dependencies (uuid, random, etc.)

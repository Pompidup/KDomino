import { loadEnvFile } from "node:process";
import inMemoryDominoes from "../driven/inMemoryDominoes.js";
import type { Game } from "../../hexagon/internal/entities/game.js";
import type {
  Orientation,
  Position,
  Rotation,
} from "../../hexagon/internal/entities/kingdom.js";
import gameStep, {
  type GameDependencies,
} from "../../hexagon/internal/services/game.js";
import {
  result,
  type FinalResult,
  type ScoreResult,
} from "../../hexagon/internal/services/result.js";
import { availableMode } from "../../hexagon/internal/entities/mode.js";
import { uuidMethod } from "../../adapters/driven/uuid.js";
import { shuffleMethod } from "../../adapters/driven/shuffle.js";

export type Resp = {
  nextLord: string;
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
  let dependencies: GameDependencies;
  try {
    loadEnvFile();
  } catch (error) {
    console.log("No .env file found. Using default configuration.");
  }

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    console.log("Game engine is running in development mode");
    dependencies = {
      dominoesRepository: inMemoryDominoes(),
      uuidMethod: () => `uuid-${Math.random()}`,
      shuffleMethod: (array) => array,
    };
  } else {
    console.log("Game engine is running in production mode");
    dependencies = {
      dominoesRepository: inMemoryDominoes(),
      uuidMethod,
      shuffleMethod,
    };
  }

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
      nextLord: drawState.lords[0]!.id,
      nextAction: "pick",
      game: drawState,
    };
  };

  const passTurn = (game: Game, lordId: string): Resp => {
    const updatedGame = pass({
      lordId,
      action: "pass",
      data: {
        state: game,
      },
    });

    const resp = defineNextAction(updatedGame, "pass", lordId);

    return resp;
  };

  const placeDomino = (
    game: Game,
    lordId: string,
    position: Position,
    orientation: Orientation,
    rotation: Rotation
  ): Resp => {
    const updatedGame = place({
      lordId,
      action: "place",
      data: {
        state: game,
        position,
        orientation,
        rotation,
      },
    });

    const resp = defineNextAction(updatedGame, "place", lordId);

    return resp;
  };

  const pickDomino = (game: Game, lordId: string, dominoPick: number): Resp => {
    const updatedGame = pick({
      lordId,
      action: "pick",
      data: {
        state: game,
        dominoPick,
      },
    });

    const resp = defineNextAction(updatedGame, "pick", lordId);

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
    currentLordId: string
  ): Resp => {
    const { lords, turn } = game;

    if (turn === 0) {
      const nextLord = lords.find((lord) => !lord.hasPick);
      if (!nextLord) {
        const newState = prepareNextTurn(game);
        return {
          nextLord: newState.lords[0]!.id,
          nextAction: "place",
          game: newState,
        };
      }
      return {
        nextLord: nextLord.id,
        nextAction: "pick",
        game,
      };
    }

    if (currentAction === "place" || currentAction === "pass") {
      if (game.turn === game.maxTurns) {
        const nextLord = lords.find((lord) => !lord.hasPlace);
        if (!nextLord) {
          return {
            nextLord: "none",
            nextAction: "end",
            game,
          };
        }
        return {
          nextLord: nextLord!.id,
          nextAction: "place",
          game,
        };
      }
      return {
        nextLord: currentLordId,
        nextAction: "pick",
        game,
      };
    }

    const allLordsHavePicked = lords.every((lord) => lord.hasPick);

    if (allLordsHavePicked) {
      const newState = prepareNextTurn(game);
      return {
        nextLord: newState.order["1"]!,
        nextAction: "place",
        game: newState,
      };
    }

    const nextLord = lords.find((lord) => !lord.hasPlace);

    return {
      nextLord: nextLord!.id,
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

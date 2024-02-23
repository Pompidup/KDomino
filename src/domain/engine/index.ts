import inMemoryDominoes from "../../infrastructure/repositories/inMemoryDominoes.js";
import inMemoryGamesRepository from "../../infrastructure/repositories/inMemoryGames.js";
import type { Game } from "../entities/game.js";
import type { Orientation, Position, Rotation } from "../entities/kingdom.js";
import gameStep, { type GameDependencies } from "../useCases/game/game.js";

export type Resp = {
  nextKing: string;
  nextAction: "pick" | "place";
  game: Game;
};

const gameEngine = () => {
  const gamesRepository = inMemoryGamesRepository();
  const dependencies: GameDependencies = {
    dominoesRepository: inMemoryDominoes(),
    gamesRepository,
    uuidMethod: () => `uuid-${Math.random()}`,
    randomMethod: (array) => array,
  };
  const { init, setup, firstTurn, getGame, pick, place, endTurn } =
    gameStep(dependencies);

  const start = async (players: { name: string }[]): Promise<Resp> => {
    const initState = await init();
    const setupState = await setup({
      state: initState,
      players,
    });

    const startState = await firstTurn({ state: setupState });
    const kings = startState.game.kings;

    //find king with lowest order and haven't played
    kings.sort((a, b) => a.order - b.order);
    const nextKing = kings.find((king) => !king.turnEnded)?.id;
    if (!nextKing) throw new Error("No king found");

    return {
      nextKing,
      nextAction: "pick",
      game: startState.game,
    };
  };

  const placeDomino = async (
    gameId: string,
    kingId: string,
    position: Position,
    orientation: Orientation,
    rotation: Rotation
  ): Promise<Resp> => {
    const game = await getGame(gameId);
    if (!game) throw new Error("Game not found");
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

    const kings = updatedGame.kings;
    //find king with lowest order and haven't played
    kings.sort((a, b) => a.order - b.order);
    const nextKing = kings.find((king) => !king.hasPlace);
    if (!nextKing) {
      // if all kings have placed, return next king for pick
      const nextKing = kings.find((king) => !king.hasPick);
      if (!nextKing) throw new Error("No king found");
      return {
        nextKing: nextKing.id,
        nextAction: "pick",
        game: updatedGame,
      };
    }

    return {
      nextKing: nextKing.id,
      nextAction: "place",
      game: updatedGame,
    };
  };

  const pickDomino = async (
    gameId: string,
    kingId: string,
    dominoPick: number
  ): Promise<Resp> => {
    const game = await getGame(gameId);
    if (!game) throw new Error("Game not found");
    const updatedGame = await pick({
      kingId,
      action: "pick",
      data: {
        state: game,
        dominoPick,
      },
    });

    const kings = updatedGame.kings;
    //find king with lowest order and haven't played
    kings.sort((a, b) => a.order - b.order);
    const nextKing = kings.find((king) => !king.turnEnded);
    if (!nextKing) {
      const endTurnState = await endTurn({
        state: updatedGame,
      });

      const nextKing = endTurnState.game.kings.find((king) => !king.turnEnded);
      if (!nextKing) throw new Error("No king found");
      return {
        nextKing: nextKing.id,
        nextAction: "place",
        game: endTurnState.game,
      };
    }

    return {
      nextKing: nextKing.id,
      nextAction: nextKing.hasPick ? "place" : "pick",
      game: updatedGame,
    };
  };

  return {
    start,
    placeDomino,
    pickDomino,
  };
};

export default gameEngine;

import {
  allLordsHavePlayed,
  canPass,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type GameState,
  type GameStateResult,
  type GameWithNextAction,
  gameSteps,
  type NextAction,
  type NextStep,
} from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, ok } from "@utils/result.js";
import { canPlaceDominoUseCase } from "./getValidPlacements.js";

export type DiscardDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
) => GameStateResult;

export const discardDominoUseCase: DiscardDominoUseCase = (game, lordId) => {
  const nextAction = game.nextAction;

  const currentLord = game.lords.find(
    (lord) => lord.id === nextAction.nextLord,
  );

  if (!currentLord) {
    return err(ErrorCode.LORD_NOT_FOUND);
  }

  if (currentLord.id !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (!canPass(currentLord)) {
    return err(ErrorCode.CANNOT_PLACE);
  }

  if (currentLord.dominoPicked) {
    const currentPlayer = game.players.find(
      (player) => player.id === currentLord.playerId,
    );

    if (
      currentPlayer &&
      canPlaceDominoUseCase(
        currentPlayer.kingdom,
        currentLord.dominoPicked,
        game.rules.basic.maxKingdomSize,
      )
    ) {
      return err(ErrorCode.CANNOT_PLACE);
    }
  }

  const maxTurns = game.rules.basic.maxTurns;
  const currentTurn = game.turn;
  const isLastTurn = currentTurn === maxTurns;

  // A received domino left out of the kingdom: Harmony is no longer reachable
  const players = currentLord.dominoPicked
    ? game.players.map((player) =>
        player.id === currentLord.playerId
          ? {
              ...player,
              discardedDominoes: (player.discardedDominoes ?? 0) + 1,
            }
          : player,
      )
    : game.players;

  const updatedLord = game.lords.map((lord) => {
    if (lord.id === currentLord.id) {
      if (isLastTurn) {
        return {
          ...lord,
          turnEnded: true,
          hasPlace: true,
        };
      }

      return {
        ...lord,
        hasPlace: true,
      };
    }
    return lord;
  });

  // Queendomino (incl. AoG-QD): discarding only replaces action A. The player
  // still may construct a building and bribe the Dragon (actions C and D), but
  // cannot tax with a knight since no domino was just placed (action B).
  if (game.queendomino) {
    return ok({
      ...game,
      players,
      lords: updatedLord,
      queendomino: { ...game.queendomino, lastPlacedPositions: [] },
      nextAction: {
        type: "action",
        nextLord: currentLord.id,
        nextAction: playerActions.constructBuilding,
      },
    });
  }

  let updatedGame: GameState;

  const resultStep: NextStep = {
    type: "step",
    step: gameSteps.result,
  };

  if (isLastTurn && allLordsHavePlayed(updatedLord)) {
    updatedGame = {
      ...game,
      players,
      lords: updatedLord,
      nextAction: resultStep,
    };
  } else {
    updatedGame = {
      ...game,
      players,
      lords: updatedLord,
      nextAction: <NextAction>nextLordWithAction(updatedLord),
    };
  }

  return ok(updatedGame);
};

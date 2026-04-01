import {
  allLordsHavePlayed,
  canPass,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import {
  gameSteps,
  type GameState,
  type GameStateResult,
  type GameWithNextAction,
  type NextAction,
  type NextStep,
} from "@core/domain/types/game.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { canPlaceDominoUseCase } from "./getValidPlacements.js";
import { err, ok } from "@utils/result.js";

export type DiscardDominoUseCase = (
  game: GameWithNextAction,
  lordId: string
) => GameStateResult;

export const discardDominoUseCase: DiscardDominoUseCase = (game, lordId) => {
  const nextAction = game.nextAction;

  const currentLord = game.lords.find(
    (lord) => lord.id === nextAction.nextLord
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
      (player) => player.id === currentLord.playerId
    );

    if (currentPlayer && canPlaceDominoUseCase(currentPlayer.kingdom, currentLord.dominoPicked, game.rules.basic.maxKingdomSize)) {
      return err(ErrorCode.CANNOT_PLACE);
    }
  }

  const maxTurns = game.rules.basic.maxTurns;
  const currentTurn = game.turn;
  const isLastTurn = currentTurn === maxTurns;

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

  let updatedGame: GameState;

  const resultStep: NextStep = {
    type: "step",
    step: gameSteps.result,
  };

  if (isLastTurn && allLordsHavePlayed(updatedLord)) {
    updatedGame = {
      ...game,
      lords: updatedLord,
      nextAction: resultStep,
    };
  } else {
    updatedGame = {
      ...game,
      lords: updatedLord,
      nextAction: <NextAction>nextLordWithAction(updatedLord),
    };
  }

  return ok(updatedGame);
};

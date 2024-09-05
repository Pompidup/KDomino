import {
  allLordsHavePlayed,
  canPass,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import {
  gameSteps,
  type GameResult,
  type GameWithNextAction,
  type GameWithNextStep,
  type NextAction,
  type NextStep,
} from "@core/domain/types/game.js";
import { err, ok } from "@utils/result.js";

export type DiscardDominoUseCase = (
  game: GameWithNextAction,
  lordId: string
) => GameResult;

export const discardDominoUseCase: DiscardDominoUseCase = (game, lordId) => {
  const nextAction = game.nextAction;

  const currentLord = game.lords.find(
    (lord) => lord.id === nextAction.nextLord
  );

  if (!currentLord) {
    return err("Lord not found");
  }

  if (currentLord.id !== lordId) {
    return err("Not your turn");
  }

  if (!canPass(currentLord)) {
    return err("Lord can't pass");
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

  let updatedGame: GameWithNextAction | GameWithNextStep;

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

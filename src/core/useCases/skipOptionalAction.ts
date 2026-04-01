import {
  allLordsHavePlayed,
  nextLordWithAction,
  nextQueenDominoAction,
} from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  gameSteps,
  type GameStateResult,
  type GameWithNextAction,
  type NextAction,
} from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, ok } from "@utils/result.js";

export type SkipOptionalActionUseCase = (
  game: GameWithNextAction,
  lordId: string,
) => GameStateResult;

export const skipOptionalActionUseCase: SkipOptionalActionUseCase = (
  game,
  lordId,
) => {
  const currentAction = game.nextAction;

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  const action = currentAction.nextAction;
  const isOptional =
    action === playerActions.placeKnight ||
    action === playerActions.constructBuilding ||
    action === playerActions.useDragon;

  if (!isOptional) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  const nextAction = nextQueenDominoAction(action);

  if (nextAction === playerActions.pickDomino) {
    // Done with optional actions, advance to next lord or result
    const maxTurns = game.rules.basic.maxTurns;
    const isLastTurn = game.turn === maxTurns;

    if (isLastTurn && allLordsHavePlayed(game.lords)) {
      return ok({
        ...game,
        nextAction: { type: "step", step: gameSteps.result },
      });
    }

    return ok({
      ...game,
      nextAction: <NextAction>nextLordWithAction(game.lords),
    });
  }

  return ok({
    ...game,
    nextAction: {
      type: "action",
      nextLord: lordId,
      nextAction: nextAction,
    },
  });
};

import {
  allLordsHavePlayed,
  nextLordWithAction,
  nextOriginsAction,
  nextQueenDominoAction,
} from "@core/domain/entities/lord.js";
import { isOriginsMode, isTribeMode } from "@core/domain/entities/originsHelpers.js";
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

  // Queendomino optional actions
  const isQueenDominoOptional =
    action === playerActions.placeKnight ||
    action === playerActions.constructBuilding ||
    action === playerActions.useDragon;

  // Origins optional actions
  const isOriginsOptional =
    action === playerActions.placeFireToken ||
    action === playerActions.recruitCaveman;

  if (!isQueenDominoOptional && !isOriginsOptional) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  if (isOriginsOptional) {
    return handleOriginsSkip(game, lordId, action);
  }

  // Queendomino skip logic
  const nextAction = nextQueenDominoAction(action);

  if (nextAction === playerActions.pickDomino) {
    return advanceToNextLordOrResult(game);
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

const handleOriginsSkip = (
  game: GameWithNextAction,
  lordId: string,
  action: string,
): GameStateResult => {
  // Clear pending fire token if skipping fire token placement
  let updatedOrigins = game.origins;
  if (action === playerActions.placeFireToken && updatedOrigins?.pendingFireToken) {
    updatedOrigins = {
      ...updatedOrigins,
      pendingFireToken: undefined,
    };
  }

  const tribe = isTribeMode(game.mode.name);
  const nextAction = nextOriginsAction(action as typeof playerActions.placeFireToken, tribe);

  const updatedGame = {
    ...game,
    ...(updatedOrigins !== undefined && { origins: updatedOrigins }),
  };

  // pickDomino means we're done with pre-pick optional actions
  if (nextAction === playerActions.pickDomino) {
    return advanceToNextLordOrResult(updatedGame);
  }

  // recruitCaveman is the final optional action in Tribe mode
  // The turn transition already happened in chooseDomino, just advance
  if (action === playerActions.recruitCaveman) {
    return advanceToNextLordOrResult(updatedGame);
  }

  return ok({
    ...updatedGame,
    nextAction: {
      type: "action",
      nextLord: lordId,
      nextAction: nextAction,
    },
  });
};

const advanceToNextLordOrResult = (
  game: GameWithNextAction,
): GameStateResult => {
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
    nextAction: nextLordWithAction(game.lords) as NextAction,
  });
};

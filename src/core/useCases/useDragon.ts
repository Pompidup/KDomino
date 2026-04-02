import { destroyWithDragon } from "@core/domain/entities/building.js";
import {
  allLordsHavePlayed,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type GameStateResult,
  type GameWithNextAction,
  gameSteps,
  type NextAction,
} from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, ok } from "@utils/result.js";

export type UseDragonUseCase = (
  game: GameWithNextAction,
  lordId: string,
  buildingId: number,
) => GameStateResult;

export const useDragonUseCase: UseDragonUseCase = (
  game,
  lordId,
  buildingId,
) => {
  const currentAction = game.nextAction;

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (currentAction.nextAction !== playerActions.useDragon) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  if (!game.queendomino) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  if (
    !game.queendomino.dragonAvailable ||
    game.queendomino.dragonUsedThisRound
  ) {
    return err(ErrorCode.DRAGON_UNAVAILABLE);
  }

  const currentLord = game.lords.find((l) => l.id === lordId);
  if (!currentLord) return err(ErrorCode.LORD_NOT_FOUND);

  const currentPlayer = game.players.find((p) => p.id === currentLord.playerId);
  if (!currentPlayer) return err(ErrorCode.PLAYER_NOT_FOUND);

  // Queen holder cannot use dragon
  if (game.queendomino.queenHolderId === currentPlayer.id) {
    return err(ErrorCode.QUEEN_HOLDER_CANNOT_USE_DRAGON);
  }

  const result = destroyWithDragon(
    game.queendomino.buildersBoard,
    buildingId,
    currentPlayer,
  );

  if (!result) {
    return err(ErrorCode.BUILDING_NOT_FOUND);
  }

  const { updatedBoard, updatedPlayer } = result;

  const updatedPlayers = game.players.map((p) =>
    p.id === currentPlayer.id ? updatedPlayer : p,
  );

  // After dragon, advance to pickDomino (or result)
  const maxTurns = game.rules.basic.maxTurns;
  const isLastTurn = game.turn === maxTurns;

  if (isLastTurn && allLordsHavePlayed(game.lords)) {
    return ok({
      ...game,
      players: updatedPlayers,
      queendomino: {
        ...game.queendomino,
        buildersBoard: updatedBoard,
        dragonUsedThisRound: true,
      },
      nextAction: { type: "step", step: gameSteps.result },
    });
  }

  return ok({
    ...game,
    players: updatedPlayers,
    queendomino: {
      ...game.queendomino,
      buildersBoard: updatedBoard,
      dragonUsedThisRound: true,
    },
    nextAction: <NextAction>nextLordWithAction(game.lords),
  });
};

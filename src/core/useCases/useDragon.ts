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
import { type Player, playerActions } from "@core/domain/types/player.js";
import type { QueenDominoState } from "@core/domain/types/queendomino.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type UseDragonUseCase = (
  game: GameWithNextAction,
  lordId: string,
  buildingId: number,
) => GameStateResult;

/**
 * Everything `useDragon` needs before checking the target building: the
 * current player and the Queendomino state, once the Dragon is known to be
 * usable by the lord (its turn, still in its cave this round, lord not hosting
 * the Queen). Shared with `getValidDragonTargets` so both apply the same checks.
 */
export type DragonActionContext = {
  player: Player;
  queendomino: QueenDominoState;
};

export const resolveDragon = (
  game: GameWithNextAction,
  lordId: string,
): Result<DragonActionContext> => {
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

  return ok({ player: currentPlayer, queendomino: game.queendomino });
};

export const useDragonUseCase: UseDragonUseCase = (
  game,
  lordId,
  buildingId,
) => {
  const context = resolveDragon(game, lordId);
  if (isErr(context)) {
    return context;
  }

  const { player: currentPlayer, queendomino } = context.value;

  // Burn the building for 1 coin (official rule, action D)
  const result = destroyWithDragon(
    queendomino.buildersBoard,
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
        ...queendomino,
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
      ...queendomino,
      buildersBoard: updatedBoard,
      dragonUsedThisRound: true,
    },
    nextAction: <NextAction>nextLordWithAction(game.lords),
  });
};

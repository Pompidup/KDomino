import { isAgeOfGiantsQueenDominoMode } from "@core/domain/entities/ageOfGiantsHelpers.js";
import {
  findCrownsNotCoveredByGiants,
  removeGiantFromPlayer,
  sendGiantToOpponent,
} from "@core/domain/entities/giant.js";
import {
  advanceToNextLordOrResult,
  nextAgeOfGiantsAction,
} from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameStateResult,
  GameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type SendGiantUseCase = (
  game: GameWithNextAction,
  lordId: string,
  giantIndex: number,
  targetPlayerId: string,
  targetCrownPosition?: Position,
) => GameStateResult;

/**
 * Continues the sender's turn once the sent giant is on the opponent's
 * kingdom: next AoG-QD optional action, next lord, or the result step.
 */
export const continueAfterSendGiant = (
  game: GameWithNextAction,
  senderLordId: string,
): GameStateResult => {
  const isAoGQD = isAgeOfGiantsQueenDominoMode(game.mode.name);
  const nextAction = nextAgeOfGiantsAction(playerActions.sendGiant, isAoGQD);

  if (nextAction === playerActions.pickDomino) {
    return ok(advanceToNextLordOrResult(game, game.lords));
  }

  return ok({
    ...game,
    nextAction: {
      type: "action",
      nextLord: senderLordId,
      nextAction: nextAction,
    },
  });
};

/**
 * Checks that `lordId` may send a giant now and returns the sending player.
 * Shared with `getValidGiantTargets` so both apply the same checks.
 */
export const resolveGiantSender = (
  game: GameWithNextAction,
  lordId: string,
): Result<Player> => {
  const currentAction = game.nextAction;

  if (currentAction.nextAction !== playerActions.sendGiant) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (!game.ageOfGiants) {
    return err(ErrorCode.NOT_AOG_MODE);
  }

  const currentLord = game.lords.find((l) => l.id === lordId);
  if (!currentLord) {
    return err(ErrorCode.LORD_NOT_FOUND);
  }

  const sourcePlayer = game.players.find((p) => p.id === currentLord.playerId);
  if (!sourcePlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  return ok(sourcePlayer);
};

/**
 * A player who can receive a giant from `sourcePlayer`, with its crowns not
 * yet covered by a giant.
 */
export type GiantTarget = {
  targetPlayer: Player;
  freeCrowns: Position[];
};

/**
 * Checks that `targetPlayerId` is an opponent of `sourcePlayer` with at least
 * one free crown. Shared with `getValidGiantTargets`.
 */
export const resolveGiantTarget = (
  game: GameWithNextAction,
  sourcePlayer: Player,
  targetPlayerId: string,
): Result<GiantTarget> => {
  const targetPlayer = game.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  if (sourcePlayer.id === targetPlayer.id) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  const freeCrowns = findCrownsNotCoveredByGiants(
    targetPlayer.kingdom,
    targetPlayer.giants ?? [],
  );
  if (freeCrowns.length === 0) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  return ok({ targetPlayer, freeCrowns });
};

export const sendGiantUseCase: SendGiantUseCase = (
  game,
  lordId,
  giantIndex,
  targetPlayerId,
  targetCrownPosition,
) => {
  const sender = resolveGiantSender(game, lordId);
  if (isErr(sender)) {
    return sender;
  }
  const sourcePlayer = sender.value;

  const target = resolveGiantTarget(game, sourcePlayer, targetPlayerId);
  if (isErr(target)) {
    return target;
  }
  const { targetPlayer, freeCrowns } = target.value;

  // Official rule: the targeted opponent chooses the crown. With a single
  // free crown there is no choice; with several, the opponent is asked
  // through a `placeGiant` action (unless the caller already passes the
  // crown the opponent chose, which is kept for backward compatibility).
  const crown =
    targetCrownPosition ?? (freeCrowns.length === 1 ? freeCrowns[0] : null);

  if (!crown) {
    const removed = removeGiantFromPlayer(sourcePlayer, giantIndex);
    if (isErr(removed)) {
      return removed;
    }

    const targetLord = game.lords.find((l) => l.playerId === targetPlayer.id);
    if (!targetLord) {
      return err(ErrorCode.LORD_NOT_FOUND);
    }

    return ok({
      ...game,
      players: game.players.map((p) =>
        p.id === sourcePlayer.id ? removed.value : p,
      ),
      ageOfGiants: game.ageOfGiants && {
        ...game.ageOfGiants,
        pendingGiant: { fromLordId: lordId, targetPlayerId: targetPlayer.id },
      },
      nextAction: {
        type: "action",
        nextLord: targetLord.id,
        nextAction: playerActions.placeGiant,
      },
    });
  }

  const result = sendGiantToOpponent(
    sourcePlayer,
    targetPlayer,
    giantIndex,
    crown,
  );
  if (isErr(result)) {
    return result;
  }

  const updatedPlayers = game.players.map((p) => {
    if (p.id === result.value.source.id) return result.value.source;
    if (p.id === result.value.target.id) return result.value.target;
    return p;
  });

  return continueAfterSendGiant({ ...game, players: updatedPlayers }, lordId);
};

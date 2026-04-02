import { isAgeOfGiantsQueenDominoMode } from "@core/domain/entities/ageOfGiantsHelpers.js";
import { sendGiantToOpponent } from "@core/domain/entities/giant.js";
import {
  allLordsHavePlayed,
  nextAgeOfGiantsAction,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type GameStateResult,
  type GameWithNextAction,
  gameSteps,
  type NextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, isErr, ok } from "@utils/result.js";

export type SendGiantUseCase = (
  game: GameWithNextAction,
  lordId: string,
  giantIndex: number,
  targetPlayerId: string,
  targetCrownPosition: Position,
) => GameStateResult;

export const sendGiantUseCase: SendGiantUseCase = (
  game,
  lordId,
  giantIndex,
  targetPlayerId,
  targetCrownPosition,
) => {
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

  const targetPlayer = game.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  if (sourcePlayer.id === targetPlayer.id) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  const result = sendGiantToOpponent(
    sourcePlayer,
    targetPlayer,
    giantIndex,
    targetCrownPosition,
  );
  if (isErr(result)) {
    return result;
  }

  const updatedPlayers = game.players.map((p) => {
    if (p.id === result.value.source.id) return result.value.source;
    if (p.id === result.value.target.id) return result.value.target;
    return p;
  });

  // Determine next action
  const isAoGQD = isAgeOfGiantsQueenDominoMode(game.mode.name);
  const nextAction = nextAgeOfGiantsAction(playerActions.sendGiant, isAoGQD);

  if (nextAction === playerActions.pickDomino) {
    const isLastTurn = game.turn === game.rules.basic.maxTurns;
    if (isLastTurn && allLordsHavePlayed(game.lords)) {
      return ok({
        ...game,
        players: updatedPlayers,
        nextAction: { type: "step", step: gameSteps.result },
      });
    }
    return ok({
      ...game,
      players: updatedPlayers,
      nextAction: nextLordWithAction(game.lords) as NextAction,
    });
  }

  return ok({
    ...game,
    players: updatedPlayers,
    nextAction: {
      type: "action",
      nextLord: lordId,
      nextAction: nextAction,
    },
  });
};

import { isAgeOfGiantsQueenDominoMode } from "@core/domain/entities/ageOfGiantsHelpers.js";
import {
  placeGiantOnCrown,
  takeFromGiantPool,
} from "@core/domain/entities/giant.js";
import {
  allLordsHavePlayed,
  nextAgeOfGiantsAction,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  AgeOfGiantsState,
  PendingGiant,
} from "@core/domain/types/ageOfGiants.js";
import {
  type GameStateResult,
  type GameWithNextAction,
  gameSteps,
  type NextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { err, isErr, ok, type Result } from "@utils/result.js";
import { continueAfterSendGiant } from "./sendGiant.js";

export type PlaceGiantUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
) => GameStateResult;

/**
 * Everything `placeGiant` needs before checking the crown: the player whose
 * kingdom receives the giant (the current player, or the targeted player of a
 * giant sent by an opponent) and, in that case, the pending giant.
 * Shared with `getValidGiantPositions` so both apply the same checks.
 */
export type GiantPlacementContext = {
  player: Player;
  /** Set when the giant was sent by an opponent (not taken from the pool) */
  pendingGiant?: PendingGiant;
  /**
   * Age of Giants state once the giant is taken: one giant less in the pool,
   * or the pending giant resolved.
   */
  updatedAgeOfGiants: AgeOfGiantsState;
};

export const resolveGiantPlacement = (
  game: GameWithNextAction,
  lordId: string,
): Result<GiantPlacementContext> => {
  const currentAction = game.nextAction;

  if (currentAction.nextAction !== playerActions.placeGiant) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (!game.ageOfGiants) {
    return err(ErrorCode.NOT_AOG_MODE);
  }

  // A giant sent by an opponent: the targeted player chooses the crown, the
  // giant does not come from the pool, then the sender's turn resumes.
  const pendingGiant = game.ageOfGiants.pendingGiant;
  if (pendingGiant) {
    const lord = game.lords.find((l) => l.id === lordId);
    if (!lord || lord.playerId !== pendingGiant.targetPlayerId) {
      return err(ErrorCode.NOT_YOUR_TURN);
    }
    const target = game.players.find((p) => p.id === lord.playerId);
    if (!target) {
      return err(ErrorCode.PLAYER_NOT_FOUND);
    }
    const { pendingGiant: _resolved, ...updatedAgeOfGiants } = game.ageOfGiants;
    return ok({ player: target, pendingGiant, updatedAgeOfGiants });
  }

  // Take from giant pool
  const poolResult = takeFromGiantPool(game.ageOfGiants.giantPool);
  if (isErr(poolResult)) {
    return poolResult;
  }

  const currentLord = game.lords.find((l) => l.id === lordId);
  if (!currentLord) {
    return err(ErrorCode.LORD_NOT_FOUND);
  }

  const currentPlayer = game.players.find((p) => p.id === currentLord.playerId);
  if (!currentPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  return ok({
    player: currentPlayer,
    updatedAgeOfGiants: { ...game.ageOfGiants, giantPool: poolResult.value },
  });
};

export const placeGiantUseCase: PlaceGiantUseCase = (
  game,
  lordId,
  position,
) => {
  const context = resolveGiantPlacement(game, lordId);
  if (isErr(context)) {
    return context;
  }

  const {
    player: currentPlayer,
    pendingGiant,
    updatedAgeOfGiants: updatedAoG,
  } = context.value;

  // Place giant on the chosen crown
  const placeResult = placeGiantOnCrown(currentPlayer, position);
  if (isErr(placeResult)) {
    return placeResult;
  }

  // A giant sent by an opponent: the targeted player chose the crown, then
  // the sender's turn resumes.
  if (pendingGiant) {
    return continueAfterSendGiant(
      {
        ...game,
        players: game.players.map((p) =>
          p.id === currentPlayer.id ? placeResult.value : p,
        ),
        ageOfGiants: updatedAoG,
      },
      pendingGiant.fromLordId,
    );
  }

  const updatedPlayers = game.players.map((p) =>
    p.id === currentPlayer.id ? placeResult.value : p,
  );

  // Determine next action
  const isAoGQD = isAgeOfGiantsQueenDominoMode(game.mode.name);
  const nextAction = nextAgeOfGiantsAction(playerActions.placeGiant, isAoGQD);

  if (nextAction === playerActions.pickDomino) {
    // No more optional actions — advance to next lord or result
    const isLastTurn = game.turn === game.rules.basic.maxTurns;
    if (isLastTurn && allLordsHavePlayed(game.lords)) {
      return ok({
        ...game,
        players: updatedPlayers,
        ageOfGiants: updatedAoG,
        nextAction: { type: "step", step: gameSteps.result },
      });
    }
    return ok({
      ...game,
      players: updatedPlayers,
      ageOfGiants: updatedAoG,
      nextAction: nextLordWithAction(game.lords) as NextAction,
    });
  }

  // More optional actions (e.g., placeKnight in AoG-QD)
  return ok({
    ...game,
    players: updatedPlayers,
    ageOfGiants: updatedAoG,
    nextAction: {
      type: "action",
      nextLord: lordId,
      nextAction: nextAction,
    },
  });
};

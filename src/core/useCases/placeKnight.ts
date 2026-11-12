import {
  canPlaceKnight,
  hasKnightAvailable,
  placeKnight,
} from "@core/domain/entities/knight.js";
import { nextQueenDominoAction } from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameStateResult,
  GameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type PlaceKnightUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
) => GameStateResult;

/**
 * Everything `placeKnight` needs before checking the target square: the
 * current player and the squares a knight may go on (the domino just placed).
 * Shared with `getValidKnightPositions` so both apply the same checks.
 */
export type KnightPlacementContext = {
  player: Player;
  allowedPositions: Position[];
};

export const resolveKnightPlacement = (
  game: GameWithNextAction,
  lordId: string,
): Result<KnightPlacementContext> => {
  const currentAction = game.nextAction;

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (currentAction.nextAction !== playerActions.placeKnight) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  const currentLord = game.lords.find((l) => l.id === lordId);
  if (!currentLord) return err(ErrorCode.LORD_NOT_FOUND);

  const currentPlayer = game.players.find((p) => p.id === currentLord.playerId);
  if (!currentPlayer) return err(ErrorCode.PLAYER_NOT_FOUND);

  // Knights may only be placed on the domino the lord has just placed
  const allowedPositions = game.queendomino?.lastPlacedPositions ?? [];

  return ok({ player: currentPlayer, allowedPositions });
};

export const placeKnightUseCase: PlaceKnightUseCase = (
  game,
  lordId,
  position,
) => {
  const context = resolveKnightPlacement(game, lordId);
  if (isErr(context)) {
    return context;
  }

  const { player: currentPlayer, allowedPositions } = context.value;

  // Every knight the player owns is already placed: the limit is the cause,
  // whatever the square
  if (!hasKnightAvailable(currentPlayer)) {
    return err(ErrorCode.MAX_KNIGHTS_REACHED);
  }

  if (
    !canPlaceKnight(
      currentPlayer,
      currentPlayer.kingdom,
      position,
      allowedPositions,
    )
  ) {
    return err(ErrorCode.CANNOT_PLACE_KNIGHT);
  }

  const updatedPlayer = placeKnight(
    currentPlayer,
    currentPlayer.kingdom,
    position,
  );

  const updatedPlayers = game.players.map((p) =>
    p.id === currentPlayer.id ? updatedPlayer : p,
  );

  // Official rule: "You may place up to 2 Knights during your turn, one for
  // each square on the domino you just added". The action stays on
  // placeKnight while another knight can still be placed (skippable).
  const canPlaceAnother = allowedPositions.some((square) =>
    canPlaceKnight(
      updatedPlayer,
      updatedPlayer.kingdom,
      square,
      allowedPositions,
    ),
  );
  const nextAction = canPlaceAnother
    ? playerActions.placeKnight
    : nextQueenDominoAction(playerActions.placeKnight);

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

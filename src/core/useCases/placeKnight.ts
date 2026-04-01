import { canPlaceKnight, placeKnight } from "@core/domain/entities/knight.js";
import { nextQueenDominoAction } from "@core/domain/entities/lord.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { GameStateResult, GameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, ok } from "@utils/result.js";

export type PlaceKnightUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
) => GameStateResult;

export const placeKnightUseCase: PlaceKnightUseCase = (
  game,
  lordId,
  position,
) => {
  const currentAction = game.nextAction;

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (currentAction.nextAction !== playerActions.placeKnight) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  const currentLord = game.lords.find((l) => l.id === lordId);
  if (!currentLord) return err(ErrorCode.LORD_NOT_FOUND);

  const currentPlayer = game.players.find(
    (p) => p.id === currentLord.playerId,
  );
  if (!currentPlayer) return err(ErrorCode.PLAYER_NOT_FOUND);

  if (!canPlaceKnight(currentPlayer, currentPlayer.kingdom, position)) {
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

  const nextAction = nextQueenDominoAction(playerActions.placeKnight);

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

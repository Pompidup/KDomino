import { isValidFireTokenPosition } from "@core/domain/entities/fireToken.js";
import { advanceToNextLordOrResult } from "@core/domain/entities/lord.js";
import { refreshTotemHolders } from "@core/domain/entities/totem.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameState,
  GameStateResult,
  GameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type {
  PendingFireToken,
  PlacedFireToken,
} from "@core/domain/types/origins.js";
import type { Player } from "@core/domain/types/player.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type PlaceFireTokenUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
) => GameStateResult;

/**
 * Everything `placeFireToken` needs before checking the target square: the
 * current player, the pending fire token and the fire tokens already placed.
 * Shared with `getValidFireTokenPositions` so both apply the same checks.
 */
export type FireTokenPlacementContext = {
  player: Player;
  pending: PendingFireToken;
  existingTokens: PlacedFireToken[];
};

export const resolveFireTokenPlacement = (
  game: GameWithNextAction,
  lordId: string,
): Result<FireTokenPlacementContext> => {
  const currentLord = game.lords.find(
    (lord) => lord.id === game.nextAction.nextLord,
  );

  if (!currentLord) {
    return err(ErrorCode.LORD_NOT_FOUND);
  }

  if (currentLord.id !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (!game.origins?.pendingFireToken) {
    return err(ErrorCode.NO_PENDING_FIRE_TOKEN);
  }

  const pending = game.origins.pendingFireToken;

  const currentPlayer = game.players.find(
    (player) => player.id === currentLord.playerId,
  );

  if (!currentPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  return ok({
    player: currentPlayer,
    pending,
    existingTokens: currentPlayer.fireTokens ?? [],
  });
};

export const placeFireTokenUseCase: PlaceFireTokenUseCase = (
  game,
  lordId,
  position,
) => {
  const context = resolveFireTokenPlacement(game, lordId);
  if (isErr(context)) {
    return context;
  }

  const { player: currentPlayer, pending, existingTokens } = context.value;
  const { fires, volcanoPosition } = pending;

  if (
    !isValidFireTokenPosition(
      currentPlayer.kingdom,
      position,
      volcanoPosition,
      fires,
      existingTokens,
    )
  ) {
    return err(ErrorCode.FIRE_TOKEN_INVALID_POSITION);
  }

  // Place the fire token
  const newToken: PlacedFireToken = { fires, position };
  const updatedFireTokens = [...existingTokens, newToken];

  // Destroy resource at position if any (Totem/Tribe modes)
  let updatedResources = currentPlayer.resources;
  if (updatedResources) {
    updatedResources = updatedResources.filter(
      (r) => !(r.position.x === position.x && r.position.y === position.y),
    );
  }

  // Destroy caveman at position if any (Tribe mode)
  let updatedCavemen = currentPlayer.cavemen;
  if (updatedCavemen) {
    updatedCavemen = updatedCavemen.filter(
      (c) => !(c.position.x === position.x && c.position.y === position.y),
    );
  }

  const updatedPlayers = game.players.map((player) => {
    if (player.id === currentPlayer.id) {
      return {
        ...player,
        fireTokens: updatedFireTokens,
        ...(updatedResources !== undefined && { resources: updatedResources }),
        ...(updatedCavemen !== undefined && { cavemen: updatedCavemen }),
      };
    }
    return player;
  });

  // Clear pending fire token and re-evaluate totems (a destroyed resource
  // may cost the majority in Totem mode)
  const updatedOrigins = refreshTotemHolders(
    game.origins && { ...game.origins, pendingFireToken: undefined },
    updatedPlayers,
  );

  // Determine next action: the game only ends once every lord has
  // finished the last turn
  const nextGameAction: GameState = advanceToNextLordOrResult(
    {
      ...game,
      players: updatedPlayers,
      ...(updatedOrigins !== undefined && { origins: updatedOrigins }),
    },
    game.lords,
  );

  return ok(nextGameAction);
};

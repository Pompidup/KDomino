import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { isValidFireTokenPosition } from "@core/domain/entities/fireToken.js";
import {
  allLordsHavePlayed,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import { isTribeMode } from "@core/domain/entities/originsHelpers.js";
import {
  gameSteps,
  type GameState,
  type GameStateResult,
  type GameWithNextAction,
  type NextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type { PlacedFireToken } from "@core/domain/types/origins.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, ok } from "@utils/result.js";

export type PlaceFireTokenUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
) => GameStateResult;

export const placeFireTokenUseCase: PlaceFireTokenUseCase = (
  game,
  lordId,
  position,
) => {
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

  const { fires, volcanoPosition } = game.origins.pendingFireToken;

  const currentPlayer = game.players.find(
    (player) => player.id === currentLord.playerId,
  );

  if (!currentPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  const existingTokens = currentPlayer.fireTokens ?? [];

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
      (c) =>
        !(c.position.x === position.x && c.position.y === position.y),
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

  // Clear pending fire token
  const updatedOrigins = {
    ...game.origins,
    pendingFireToken: undefined,
  };

  // Determine next action
  const isLastTurn = game.turn === game.rules.basic.maxTurns;

  let nextGameAction: GameState;

  if (isLastTurn && allLordsHavePlayed(game.lords)) {
    nextGameAction = {
      ...game,
      players: updatedPlayers,
      origins: updatedOrigins,
      nextAction: { type: "step", step: gameSteps.result },
    };
  } else if (isLastTurn) {
    nextGameAction = {
      ...game,
      players: updatedPlayers,
      origins: updatedOrigins,
      nextAction: { type: "step", step: gameSteps.result },
    };
  } else {
    nextGameAction = {
      ...game,
      players: updatedPlayers,
      origins: updatedOrigins,
      nextAction: nextLordWithAction(game.lords) as NextAction,
    };
  }

  return ok(nextGameAction);
};

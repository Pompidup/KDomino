import {
  isValidCavemanPosition,
  takeCavemanFromDrawPile,
  takeCavemanFromVisible,
} from "@core/domain/entities/caveman.js";
import {
  allLordsHavePlayed,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import {
  canSpendResources,
  spendResources,
} from "@core/domain/entities/resource.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type GameState,
  type GameStateResult,
  type GameWithNextAction,
  gameSteps,
  type NextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { err, ok } from "@utils/result.js";

export type RecruitCavemanUseCase = (
  game: GameWithNextAction,
  lordId: string,
  cavemanId: number,
  position: Position,
  resourcePositions: Position[],
) => GameStateResult;

export const recruitCavemanUseCase: RecruitCavemanUseCase = (
  game,
  lordId,
  cavemanId,
  position,
  resourcePositions,
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

  if (!game.origins?.caveBoard) {
    return err(ErrorCode.NOT_TRIBE_MODE);
  }

  const currentPlayer = game.players.find((p) => p.id === currentLord.playerId);

  if (!currentPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  const resources = currentPlayer.resources ?? [];
  const fireTokens = currentPlayer.fireTokens ?? [];
  const cavemen = currentPlayer.cavemen ?? [];

  // Determine if taking from visible (2 different resources) or draw pile (4 different)
  const isFromVisible = game.origins.caveBoard.visible.some(
    (c) => c.id === cavemanId,
  );
  const isFromDrawPile = game.origins.caveBoard.drawPile.some(
    (c) => c.id === cavemanId,
  );

  if (!isFromVisible && !isFromDrawPile) {
    return err(ErrorCode.CAVEMAN_NOT_FOUND);
  }

  const requiredDifferentTypes = isFromVisible ? 2 : 4;
  const requiredResourceCount = isFromVisible ? 2 : 4;

  if (resourcePositions.length !== requiredResourceCount) {
    return err(ErrorCode.INSUFFICIENT_RESOURCES);
  }

  if (
    !canSpendResources(resources, resourcePositions, requiredDifferentTypes)
  ) {
    return err(ErrorCode.INSUFFICIENT_RESOURCES);
  }

  // Validate caveman placement position
  if (
    !isValidCavemanPosition(
      currentPlayer.kingdom,
      position,
      fireTokens,
      resources,
      cavemen,
    )
  ) {
    return err(ErrorCode.INVALID_CAVEMAN_PLACEMENT);
  }

  // Take caveman from board
  let cavemanResult: ReturnType<typeof takeCavemanFromVisible>;
  if (isFromVisible) {
    cavemanResult = takeCavemanFromVisible(game.origins.caveBoard, cavemanId);
  } else {
    cavemanResult = takeCavemanFromDrawPile(game.origins.caveBoard, cavemanId);
  }

  if (!cavemanResult) {
    return err(ErrorCode.CAVEMAN_NOT_FOUND);
  }

  // Spend resources
  const updatedResources = spendResources(resources, resourcePositions);

  // Place caveman
  const updatedCavemen = [
    ...cavemen,
    { caveman: cavemanResult.caveman, position },
  ];

  const updatedPlayers = game.players.map((player) => {
    if (player.id === currentPlayer.id) {
      return {
        ...player,
        resources: updatedResources,
        cavemen: updatedCavemen,
      };
    }
    return player;
  });

  const updatedOrigins = {
    ...game.origins,
    caveBoard: cavemanResult.updatedBoard,
  };

  // Mark lord turn as ended and advance
  const updatedLords = game.lords.map((lord) => {
    if (lord.id === currentLord.id) {
      return { ...lord, turnEnded: true };
    }
    return lord;
  });

  const isLastTurn = game.turn === game.rules.basic.maxTurns;

  let nextGameAction: GameState;

  if (isLastTurn && allLordsHavePlayed(updatedLords)) {
    nextGameAction = {
      ...game,
      players: updatedPlayers,
      lords: updatedLords,
      origins: updatedOrigins,
      nextAction: { type: "step", step: gameSteps.result },
    };
  } else {
    nextGameAction = {
      ...game,
      players: updatedPlayers,
      lords: updatedLords,
      origins: updatedOrigins,
      nextAction: nextLordWithAction(updatedLords) as NextAction,
    };
  }

  return ok(nextGameAction);
};

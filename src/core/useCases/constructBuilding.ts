import {
  isValidConstructionPosition,
  placeBuildingOnKingdom,
  purchaseBuilding,
} from "@core/domain/entities/building.js";
import { nextQueenDominoAction } from "@core/domain/entities/lord.js";
import { determineQueenHolder } from "@core/domain/entities/queen.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { PlacedBuilding } from "@core/domain/types/building.js";
import type {
  GameStateResult,
  GameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import type { QueenDominoState } from "@core/domain/types/queendomino.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type ConstructBuildingUseCase = (
  game: GameWithNextAction,
  lordId: string,
  buildingId: number,
  position: Position,
) => GameStateResult;

/**
 * Everything `constructBuilding` needs before checking the construction square
 * and the purchase: the current player and the Queendomino state.
 * Shared with `getValidBuildingPositions` / `getAffordableBuildings`.
 */
export type ConstructionContext = {
  player: Player;
  queendomino: QueenDominoState;
};

export const resolveConstruction = (
  game: GameWithNextAction,
  lordId: string,
): Result<ConstructionContext> => {
  const currentAction = game.nextAction;

  if (currentAction.nextLord !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (currentAction.nextAction !== playerActions.constructBuilding) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  if (!game.queendomino) {
    return err(ErrorCode.INVALID_OPTIONAL_ACTION);
  }

  const currentLord = game.lords.find((l) => l.id === lordId);
  if (!currentLord) return err(ErrorCode.LORD_NOT_FOUND);

  const currentPlayer = game.players.find((p) => p.id === currentLord.playerId);
  if (!currentPlayer) return err(ErrorCode.PLAYER_NOT_FOUND);

  return ok({ player: currentPlayer, queendomino: game.queendomino });
};

export const constructBuildingUseCase: ConstructBuildingUseCase = (
  game,
  lordId,
  buildingId,
  position,
) => {
  const context = resolveConstruction(game, lordId);
  if (isErr(context)) {
    return context;
  }

  const { player: currentPlayer, queendomino } = context.value;

  // Validate construction position
  if (
    !isValidConstructionPosition(
      currentPlayer.kingdom,
      currentPlayer.buildings ?? [],
      position,
    )
  ) {
    return err(ErrorCode.NO_CONSTRUCTION_SQUARE);
  }

  // Purchase the building
  const purchaseResult = purchaseBuilding(
    queendomino.buildersBoard,
    currentPlayer,
    buildingId,
  );

  if (!purchaseResult) {
    return err(ErrorCode.CANNOT_AFFORD_BUILDING);
  }

  const { updatedBoard, updatedPlayer, building } = purchaseResult;

  // Place building on kingdom (adds crowns)
  const updatedKingdom = placeBuildingOnKingdom(
    updatedPlayer.kingdom,
    building,
    position,
  );

  const placedBuilding: PlacedBuilding = { building, position };
  const finalPlayer = {
    ...updatedPlayer,
    kingdom: updatedKingdom,
    buildings: [...(updatedPlayer.buildings ?? []), placedBuilding],
  };

  const updatedPlayers = game.players.map((p) =>
    p.id === currentPlayer.id ? finalPlayer : p,
  );

  // Recalculate Queen holder
  const newQueenHolder = determineQueenHolder(
    updatedPlayers,
    queendomino.queenHolderId,
  );

  const nextAction = nextQueenDominoAction(playerActions.constructBuilding);

  return ok({
    ...game,
    players: updatedPlayers,
    queendomino: {
      ...queendomino,
      buildersBoard: updatedBoard,
      queenHolderId: newQueenHolder,
    },
    nextAction: {
      type: "action",
      nextLord: lordId,
      nextAction: nextAction,
    },
  });
};

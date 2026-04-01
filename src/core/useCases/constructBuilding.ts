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
import { playerActions } from "@core/domain/types/player.js";
import { err, ok } from "@utils/result.js";

export type ConstructBuildingUseCase = (
  game: GameWithNextAction,
  lordId: string,
  buildingId: number,
  position: Position,
) => GameStateResult;

export const constructBuildingUseCase: ConstructBuildingUseCase = (
  game,
  lordId,
  buildingId,
  position,
) => {
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

  const currentPlayer = game.players.find(
    (p) => p.id === currentLord.playerId,
  );
  if (!currentPlayer) return err(ErrorCode.PLAYER_NOT_FOUND);

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
    game.queendomino.buildersBoard,
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
    game.queendomino.queenHolderId,
  );

  const nextAction = nextQueenDominoAction(playerActions.constructBuilding);

  return ok({
    ...game,
    players: updatedPlayers,
    queendomino: {
      ...game.queendomino,
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

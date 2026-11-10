import {
  getRecruitmentCost,
  isValidCavemanPosition,
  takeCavemanFromDrawPile,
  takeCavemanFromVisible,
} from "@core/domain/entities/caveman.js";
import { advanceToNextLordOrResult } from "@core/domain/entities/lord.js";
import {
  isValidResourcePayment,
  spendResources,
} from "@core/domain/entities/resource.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameState,
  GameStateResult,
  GameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type {
  CaveBoard,
  OriginsState,
  PlacedCaveman,
  PlacedFireToken,
  Resource,
} from "@core/domain/types/origins.js";
import type { Player } from "@core/domain/types/player.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type RecruitCavemanUseCase = (
  game: GameWithNextAction,
  lordId: string,
  cavemanId: number,
  position: Position,
  resourcePositions: Position[],
) => GameStateResult;

/**
 * Everything `recruitCaveman` needs before checking the recruited caveman, the
 * payment and the square: the current player, its Origins pieces and the cave
 * board. Shared with `getValidCavemanPlacements` so both apply the same checks.
 */
export type RecruitmentContext = {
  player: Player;
  origins: OriginsState;
  caveBoard: CaveBoard;
  resources: Resource[];
  fireTokens: PlacedFireToken[];
  cavemen: PlacedCaveman[];
};

export const resolveRecruitment = (
  game: GameWithNextAction,
  lordId: string,
): Result<RecruitmentContext> => {
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

  return ok({
    player: currentPlayer,
    origins: game.origins,
    caveBoard: game.origins.caveBoard,
    resources: currentPlayer.resources ?? [],
    fireTokens: currentPlayer.fireTokens ?? [],
    cavemen: currentPlayer.cavemen ?? [],
  });
};

export const recruitCavemanUseCase: RecruitCavemanUseCase = (
  game,
  lordId,
  cavemanId,
  position,
  resourcePositions,
) => {
  const context = resolveRecruitment(game, lordId);
  if (isErr(context)) {
    return context;
  }

  const {
    player: currentPlayer,
    origins,
    caveBoard,
    resources,
    fireTokens,
    cavemen,
  } = context.value;

  // Taking a visible caveman costs 2 different resources, one from the draw
  // pile costs 4 different resources
  const cost = getRecruitmentCost(caveBoard, cavemanId);

  if (!cost) {
    return err(ErrorCode.CAVEMAN_NOT_FOUND);
  }

  if (
    !isValidResourcePayment(
      resources,
      resourcePositions,
      cost.resourceCount,
      cost.differentTypes,
    )
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
  const cavemanResult =
    cost.source === "visible"
      ? takeCavemanFromVisible(caveBoard, cavemanId)
      : takeCavemanFromDrawPile(caveBoard, cavemanId);

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
    ...origins,
    caveBoard: cavemanResult.updatedBoard,
  };

  // Recruitment happens after the lord picked its new domino: chooseDomino
  // already ended this lord's turn. When that pick completed the round, the
  // lords have been reset for the next turn and must stay untouched, otherwise
  // this lord would lose its next placement and pick.
  const nextGameAction: GameState = advanceToNextLordOrResult(
    { ...game, players: updatedPlayers, origins: updatedOrigins },
    game.lords,
  );

  return ok(nextGameAction);
};
